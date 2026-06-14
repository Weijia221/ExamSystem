import { COOKIE_NAME } from "@shared/const";
import { Router, type Request, type Response, type NextFunction } from "express";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import { streamChat, buildStudentChatMessages, gradeEssay } from "./ai";
import {
  users,
  questions,
  exams,
  examQuestions,
  examRecords,
  studentAnswers,
  practiceRecords,
  type User,
} from "../drizzle/schema";
import { eq, and, count, or, isNull, sql, desc, not } from "drizzle-orm";

// Dev user auto-login when OAuth is not configured
async function getDevUser(role?: string): Promise<User | null> {
  const db = await getDb();
  if (!db || !role) return null;

  // student2, student3 等统一归为 student 角色
  const dbRole = role.startsWith("student") ? "student" : role;
  const openId = `local_${role}`;
  let user = await getUserByOpenId(openId);
  if (!user) {
    const names: Record<string, string> = { teacher: "教师", student: "学生1", admin: "管理员" };
    const suffix = role.match(/^student(\d+)$/)?.[1];
    const name = suffix ? `学生${suffix}` : (names[dbRole] ?? "用户");
    await upsertUser({
      openId,
      name,
      email: `${openId}@local.com`,
      loginMethod: "local",
      role: dbRole,
      lastSignedIn: new Date(),
    });
    user = await getUserByOpenId(openId);
  } else if (user.role !== dbRole) {
    await upsertUser({ ...user, role: dbRole, lastSignedIn: new Date() });
    user = await getUserByOpenId(openId);
  }

  // 修复旧用户名
  if (user && user.role === "student" && (!user.name || user.name === "学生" || user.name === "本地开发用户" || user.name === "学生一" || user.name === "学生二" || user.name === "学生三")) {
    await upsertUser({ ...user, name: "学生1", lastSignedIn: new Date() });
    user = await getUserByOpenId(openId);
  }

  return user ?? null;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Auth middleware — tries to authenticate, attaches user if valid
async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    req.user = await sdk.authenticateRequest(req);
  } catch {
    // If OAuth is not configured, auto-login as dev user
    if (!ENV.oAuthServerUrl) {
      const role = req.headers["x-login-role"] as string | undefined;
      req.user = await getDevUser(role || undefined);
    } else {
      req.user = undefined;
    }
  }
  next();
}

// Require authenticated user
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "请先登录" });
    return;
  }
  next();
}

export function createApiRouter(): Router {
  const router = Router();

  // Apply auth middleware to all API routes
  router.use(authMiddleware);

  // ==================== Auth ====================

  router.get("/auth/me", (req, res) => {
    res.json(req.user ?? null);
  });

  router.post("/auth/login", async (req, res) => {
    const accounts: Record<string, string> = {
      teacher: "123456", student: "123456", admin: "123456",
      student2: "123456", student3: "123456", student4: "123456", student5: "123456",
    };
    const { username, password } = req.body;
    if (!username || !password || accounts[username] !== password) {
      return res.status(401).json({ error: "账号或密码错误" });
    }

    const db = await getDb();
    if (!db) return res.status(500).json({ error: "数据库不可用" });

    // student2, student3, etc. → student role with unique openId
    const isExtraStudent = /^student[2-9]\d*$/.test(username);
    if (isExtraStudent) {
      let user = await getUserByOpenId(`local_${username}`);
      if (!user) {
        await upsertUser({
          openId: `local_${username}`,
          name: `学生${username.replace("student", "")}`,
          email: `local_${username}@local.com`,
          loginMethod: "local",
          role: "student",
          lastSignedIn: new Date(),
        });
        user = await getUserByOpenId(`local_${username}`);
      }
      return res.json(user);
    }

    const user = await getDevUser(username);
    res.json(user);
  });

  router.post("/auth/logout", (_req, res) => {
    const cookieOptions = getSessionCookieOptions(_req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ success: true });
  });

  // ==================== Questions ====================

  router.get("/questions", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      if (req.user!.role === "admin") {
        // 管理员看到所有未删除题目
        const result = await db.select().from(questions).where(isNull(questions.deletedAt));
        return res.json(result);
      }

      // 教师看到自己创建的 + 管理员创建的题目（未删除）
      const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
      const adminIds = admins.map(a => a.id);
      const visibleIds = [req.user!.id, ...adminIds];

      const result = await db
        .select()
        .from(questions)
        .where(and(
          isNull(questions.deletedAt),
          or(...visibleIds.map(id => eq(questions.createdBy, id)))
        ));
      res.json(result);
    } catch (error) {
      console.error("[API] questions.list failed:", error);
      res.status(500).json({ error: "获取题目列表失败" });
    }
  });

  router.post("/questions", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { type, title, options, correctAnswer, explanation, difficulty, category, points, gradingRubric } = req.body;

      if (!type || !title || !correctAnswer) {
        return res.status(400).json({ error: "缺少必填字段" });
      }

      const result = await db.insert(questions).values({
        createdBy: req.user!.id,
        type,
        title,
        options: options ?? null,
        correctAnswer,
        explanation: explanation ?? null,
        difficulty: difficulty ?? "medium",
        category: category ?? null,
        points: (points ?? 1).toString(),
        gradingRubric: gradingRubric ?? null,
      });

      const insertId = Number((result as any).insertId ?? (result as any)[0]?.insertId ?? 0);
      res.json({ success: true, id: insertId });
    } catch (error) {
      console.error("[API] questions.create failed:", error);
      res.status(500).json({ error: "创建题目失败" });
    }
  });

  router.put("/questions/:id", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const id = Number(req.params.id);
      const { title, options, correctAnswer, explanation, difficulty, category, points, gradingRubric } = req.body;

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (options !== undefined) updateData.options = options;
      if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
      if (explanation !== undefined) updateData.explanation = explanation;
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (category !== undefined) updateData.category = category;
      if (points !== undefined) updateData.points = points.toString();
      if (gradingRubric !== undefined) updateData.gradingRubric = gradingRubric;

      await db
        .update(questions)
        .set(updateData)
        .where(and(eq(questions.id, id), eq(questions.createdBy, req.user!.id)));

      res.json({ success: true });
    } catch (error) {
      console.error("[API] questions.update failed:", error);
      res.status(500).json({ error: "更新题目失败" });
    }
  });

  router.delete("/questions/:id", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const id = Number(req.params.id);

      // Soft delete: set deletedAt, keep data for existing exams and scores
      const whereClause = req.user!.role === "admin"
        ? eq(questions.id, id)
        : and(eq(questions.id, id), eq(questions.createdBy, req.user!.id));
      await db.update(questions).set({ deletedAt: new Date() }).where(whereClause);

      res.json({ success: true });
    } catch (error) {
      console.error("[API] questions.delete failed:", error);
      res.status(500).json({ error: "删除题目失败" });
    }
  });

  // ==================== Exams ====================

  router.get("/exams", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      let result;
      if (req.user!.role === "admin") {
        result = await db.select().from(exams);
      } else {
        // 教师看到自己创建的 + 管理员创建的试卷
        const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
        const adminIds = admins.map(a => a.id);
        const visibleIds = [req.user!.id, ...adminIds];
        result = await db.select().from(exams).where(
          or(...visibleIds.map(id => eq(exams.createdBy, id)))
        );
      }
      res.json(result);
    } catch (error) {
      console.error("[API] exams.list failed:", error);
      res.status(500).json({ error: "获取试卷列表失败" });
    }
  });

  router.post("/exams", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { title, description, totalPoints, duration, startTime, endTime, passingScore, questionIds, questionPoints, allowRetake } = req.body;

      if (!title || !totalPoints || !duration || !questionIds?.length) {
        return res.status(400).json({ error: "缺少必填字段" });
      }

      const result = await db.insert(exams).values({
        createdBy: req.user!.id,
        title,
        description: description ?? null,
        totalPoints: totalPoints.toString(),
        duration,
        startTime: startTime ? new Date(startTime) : null,
        endTime: endTime ? new Date(endTime) : null,
        passingScore: passingScore?.toString() ?? null,
        status: "draft",
        allowRetake: allowRetake !== false,
      });

      const rawInsertId = (result as any).insertId ?? (result as any)[0]?.insertId ?? 0;
      const examId = Number(rawInsertId);

      if (!examId || examId === 0) {
        const lastExam = await db.select({ id: exams.id }).from(exams).where(eq(exams.createdBy, req.user!.id));
        const fallbackId = lastExam.length > 0 ? Math.max(...lastExam.map(e => e.id)) : 0;
        if (fallbackId > 0) {
          for (let i = 0; i < questionIds.length; i++) {
            await db.insert(examQuestions).values({ examId: fallbackId, questionId: questionIds[i], order: i + 1, points: (questionPoints?.[i] ?? 1).toString() });
          }
        }
        return res.json({ success: true, id: fallbackId });
      }

      for (let i = 0; i < questionIds.length; i++) {
        await db.insert(examQuestions).values({
          examId,
          questionId: questionIds[i],
          order: i + 1,
          points: (questionPoints?.[i] ?? 1).toString(),
        });
      }

      res.json({ success: true, id: examId });
    } catch (error) {
      console.error("[API] exams.create failed:", error);
      res.status(500).json({ error: "创建试卷失败" });
    }
  });

  router.post("/exams/:id/publish", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const id = Number(req.params.id);
      await db
        .update(exams)
        .set({ status: "published" })
        .where(and(eq(exams.id, id), eq(exams.createdBy, req.user!.id)));

      res.json({ success: true });
    } catch (error) {
      console.error("[API] exams.publish failed:", error);
      res.status(500).json({ error: "发布试卷失败" });
    }
  });

  router.delete("/exams/:id", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const id = Number(req.params.id);

      await db.transaction(async (tx) => {
        // Get all exam records for this exam
        const records = await tx
          .select({ id: examRecords.id })
          .from(examRecords)
          .where(eq(examRecords.examId, id));

        // Delete student answers for each record
        for (const record of records) {
          await tx.delete(studentAnswers).where(eq(studentAnswers.examRecordId, record.id));
        }

        // Delete exam records
        await tx.delete(examRecords).where(eq(examRecords.examId, id));

        // Delete exam questions
        await tx.delete(examQuestions).where(eq(examQuestions.examId, id));

        // Delete the exam itself
        const whereClause = req.user!.role === "admin"
          ? eq(exams.id, id)
          : and(eq(exams.id, id), eq(exams.createdBy, req.user!.id));
        await tx.delete(exams).where(whereClause);
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[API] exams.delete failed:", error);
      res.status(500).json({ error: "删除试卷失败" });
    }
  });

  // ==================== Student Exams ====================

  router.get("/student/exams", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const result = await db
        .select()
        .from(exams)
        .where(eq(exams.status, "published"));

      // Check which exams the student has already taken
      const takenRecords = await db
        .select({ examId: examRecords.examId })
        .from(examRecords)
        .where(
          and(
            eq(examRecords.studentId, req.user!.id),
            or(
              eq(examRecords.status, "submitted"),
              eq(examRecords.status, "graded")
            )
          )
        );
      const takenExamIds = new Set(takenRecords.map((r) => r.examId));

      const examsWithStatus = result.map((exam) => ({
        ...exam,
        hasTaken: takenExamIds.has(exam.id),
      }));

      res.json(examsWithStatus);
    } catch (error) {
      console.error("[API] studentExams.listAvailable failed:", error);
      res.status(500).json({ error: "获取可用考试失败" });
    }
  });

  router.get("/student/exams/:id", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const examId = Number(req.params.id);

      const exam = await db.select().from(exams).where(eq(exams.id, examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      // Check if student has already taken this exam and retake is not allowed
      if (!exam[0].allowRetake) {
        const existingRecord = await db
          .select({ id: examRecords.id })
          .from(examRecords)
          .where(
            and(
              eq(examRecords.examId, examId),
              eq(examRecords.studentId, req.user!.id),
              or(
                eq(examRecords.status, "submitted"),
                eq(examRecords.status, "graded")
              )
            )
          );
        if (existingRecord.length > 0) {
          return res.status(403).json({ error: "您已参加过此考试，不可重复参加" });
        }
      }

      const examQs = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.examId, examId));

      // Fetch actual question data for each exam question
      const questionsData = [];
      for (const eq_ of examQs) {
        const q = await db.select().from(questions).where(eq(questions.id, eq_.questionId));
        if (q.length) {
          questionsData.push({
            ...q[0],
            order: eq_.order,
            examPoints: eq_.points,
          });
        }
      }

      // Sort by order
      questionsData.sort((a, b) => a.order - b.order);

      res.json({
        exam: exam[0],
        questions: questionsData,
      });
    } catch (error) {
      console.error("[API] studentExams.getExamWithQuestions failed:", error);
      res.status(500).json({ error: "获取考试详情失败" });
    }
  });

  // Practice: get all questions for students
  router.get("/student/practice/questions", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const result = await db
        .select({
          id: questions.id,
          type: questions.type,
          title: questions.title,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
          difficulty: questions.difficulty,
          category: questions.category,
          points: questions.points,
        })
        .from(questions)
        .where(isNull(questions.deletedAt));

      // Shuffle questions
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }

      res.json(result);
    } catch (error) {
      console.error("[API] studentPractice.getQuestions failed:", error);
      res.status(500).json({ error: "获取练习题目失败" });
    }
  });

  // Practice: submit answer to practiceRecords
  router.post("/student/practice/submit", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { questionId, studentAnswer, isCorrect } = req.body;
      if (!questionId || studentAnswer === undefined) {
        return res.status(400).json({ error: "缺少必填字段" });
      }

      await db.insert(practiceRecords).values({
        studentId: req.user!.id,
        questionId,
        studentAnswer,
        isCorrect: !!isCorrect,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[API] studentPractice.submit failed:", error);
      res.status(500).json({ error: "保存练习答案失败" });
    }
  });

  // Wrong answers book: get all wrong answers for current student
  router.get("/student/wrong-answers", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const studentId = req.user!.id;

      // Get wrong answers from exam records
      const examWrongs = await db
        .select({
          questionId: studentAnswers.questionId,
          studentAnswer: studentAnswers.studentAnswer,
          isCorrect: studentAnswers.isCorrect,
          source: sql<string>`'exam'`,
          createdAt: studentAnswers.createdAt,
        })
        .from(studentAnswers)
        .innerJoin(examRecords, eq(studentAnswers.examRecordId, examRecords.id))
        .where(and(eq(examRecords.studentId, studentId), eq(studentAnswers.isCorrect, false)));

      // Get wrong answers from practice records
      const practiceWrongs = await db
        .select({
          questionId: practiceRecords.questionId,
          studentAnswer: practiceRecords.studentAnswer,
          isCorrect: practiceRecords.isCorrect,
          source: sql<string>`'practice'`,
          createdAt: practiceRecords.createdAt,
        })
        .from(practiceRecords)
        .where(and(eq(practiceRecords.studentId, studentId), eq(practiceRecords.isCorrect, false)));

      // Combine and get unique question IDs
      const allWrongs = [...examWrongs, ...practiceWrongs];
      const questionIds = [...new Set(allWrongs.map((w) => w.questionId))];
      if (questionIds.length === 0) return res.json([]);

      // Get question details
      const questionDetails = await db
        .select({
          id: questions.id,
          type: questions.type,
          title: questions.title,
          options: questions.options,
          correctAnswer: questions.correctAnswer,
          explanation: questions.explanation,
          difficulty: questions.difficulty,
          category: questions.category,
        })
        .from(questions)
        .where(
          and(isNull(questions.deletedAt), or(...questionIds.map((id) => eq(questions.id, id))))
        );

      // Count total attempts and wrong attempts per question from both sources
      const examAll = await db
        .select({
          questionId: studentAnswers.questionId,
          total: count(),
          wrong: sql<number>`SUM(CASE WHEN ${studentAnswers.isCorrect} = false THEN 1 ELSE 0 END)`,
        })
        .from(studentAnswers)
        .innerJoin(examRecords, eq(studentAnswers.examRecordId, examRecords.id))
        .where(eq(examRecords.studentId, studentId))
        .groupBy(studentAnswers.questionId);

      const practiceAll = await db
        .select({
          questionId: practiceRecords.questionId,
          total: count(),
          wrong: sql<number>`SUM(CASE WHEN ${practiceRecords.isCorrect} = false THEN 1 ELSE 0 END)`,
        })
        .from(practiceRecords)
        .where(eq(practiceRecords.studentId, studentId))
        .groupBy(practiceRecords.questionId);

      // Merge attempt counts
      const attemptMap = new Map<number, { total: number; wrong: number }>();
      for (const row of examAll) {
        const prev = attemptMap.get(row.questionId) || { total: 0, wrong: 0 };
        attemptMap.set(row.questionId, { total: prev.total + row.total, wrong: prev.wrong + Number(row.wrong) });
      }
      for (const row of practiceAll) {
        const prev = attemptMap.get(row.questionId) || { total: 0, wrong: 0 };
        attemptMap.set(row.questionId, { total: prev.total + row.total, wrong: prev.wrong + Number(row.wrong) });
      }

      // Build response with error rate
      const result = questionDetails
        .map((q) => {
          const attempts = attemptMap.get(q.id) || { total: 0, wrong: 0 };
          return {
            ...q,
            totalAttempts: attempts.total,
            wrongAttempts: attempts.wrong,
            errorRate: attempts.total > 0 ? Math.round((attempts.wrong / attempts.total) * 100) : 0,
          };
        })
        .sort((a, b) => b.errorRate - a.errorRate);

      res.json(result);
    } catch (error) {
      console.error("[API] studentWrongAnswers failed:", error);
      res.status(500).json({ error: "获取错题本失败" });
    }
  });

  // Submit exam answers
  router.post("/student/exams/:id/submit", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const examId = Number(req.params.id);
      const { answers, startTime } = req.body as {
        answers: Record<number, string>; // questionId -> studentAnswer
        startTime: string;
      };

      // Get exam
      const exam = await db.select().from(exams).where(eq(exams.id, examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      // Check if student has already taken this exam and retake is not allowed
      if (!exam[0].allowRetake) {
        const existingRecord = await db
          .select({ id: examRecords.id })
          .from(examRecords)
          .where(
            and(
              eq(examRecords.examId, examId),
              eq(examRecords.studentId, req.user!.id),
              or(
                eq(examRecords.status, "submitted"),
                eq(examRecords.status, "graded")
              )
            )
          );
        if (existingRecord.length > 0) {
          return res.status(403).json({ error: "您已参加过此考试，不可重复参加" });
        }
      }

      // Get exam questions with their points
      const examQs = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.examId, examId));

      // Create exam record
      const recordResult = await db.insert(examRecords).values({
        examId,
        studentId: req.user!.id,
        startTime: new Date(startTime),
        endTime: new Date(),
        status: "submitted",
      });
      let recordId = Number((recordResult as any).insertId ?? (recordResult as any)[0]?.insertId ?? 0);

      // Fallback: if insertId is invalid, query the record we just created
      if (!recordId || recordId === 0) {
        const lastRecord = await db
          .select({ id: examRecords.id })
          .from(examRecords)
          .where(and(eq(examRecords.examId, examId), eq(examRecords.studentId, req.user!.id)));
        if (lastRecord.length > 0) {
          recordId = Math.max(...lastRecord.map(r => r.id));
        }
      }

      let totalScore = 0;
      let hasEssay = false;

      // Grade each answer
      for (const examQ of examQs) {
        const q = await db.select().from(questions).where(eq(questions.id, examQ.questionId));
        if (!q.length) continue;

        const question = q[0];
        const studentAnswer = answers[examQ.questionId] ?? "";
        let isCorrect: boolean | null = false;
        let earnedPoints = 0;

        if (question.type === "essay") {
          // 问答题不自动评分，等待教师批改或AI评分
          isCorrect = null;
          earnedPoints = 0;
          hasEssay = true;
        } else if (question.type === "single" || question.type === "trueFalse") {
          isCorrect = studentAnswer === question.correctAnswer;
        } else if (question.type === "multiple") {
          const correctSet = new Set(question.correctAnswer.split(",").filter(Boolean));
          const answerSet = new Set(studentAnswer.split(",").filter(Boolean));
          const hasWrong = [...answerSet].some((a) => !correctSet.has(a));
          const correctSelected = [...answerSet].filter((a) => correctSet.has(a)).length;
          isCorrect = correctSet.size === correctSelected && answerSet.size === correctSet.size;
          if (!hasWrong && correctSelected > 0) {
            earnedPoints = Math.round(Number(examQ.points) * (correctSelected / correctSet.size) * 10) / 10;
          }
        } else if (question.type === "fillBlank") {
          const correctAnswers = question.correctAnswer.split("|").map((a) => a.trim().toLowerCase());
          isCorrect = correctAnswers.includes(studentAnswer.trim().toLowerCase());
        }

        if (isCorrect && question.type !== "multiple" && question.type !== "essay") {
          earnedPoints = Number(examQ.points);
        }
        totalScore += earnedPoints;

        await db.insert(studentAnswers).values({
          examRecordId: recordId,
          questionId: examQ.questionId,
          studentAnswer,
          isCorrect,
          earnedPoints: earnedPoints.toString(),
        });
      }

      // Update exam record with score
      // 如果包含问答题，状态为 submitted（等待批改）；否则为 graded
      const finalScore = Math.round(totalScore * 10) / 10;
      await db
        .update(examRecords)
        .set({ score: finalScore.toString(), status: hasEssay ? "submitted" : "graded" })
        .where(eq(examRecords.id, recordId));

      res.json({
        success: true,
        recordId,
        score: finalScore,
        totalPoints: Number(exam[0].totalPoints),
        hasEssay,
      });
    } catch (error) {
      console.error("[API] studentExams.submit failed:", error);
      res.status(500).json({ error: "提交答卷失败" });
    }
  });

  // ==================== Scores ====================

  router.get("/teacher/scores", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      // Admin sees all exams, teacher sees own + admin-created exams
      let teacherExams;
      if (req.user!.role === "admin") {
        teacherExams = await db.select().from(exams);
      } else {
        const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
        const adminIds = admins.map(a => a.id);
        const visibleIds = [req.user!.id, ...adminIds];
        teacherExams = await db.select().from(exams).where(
          or(...visibleIds.map(id => eq(exams.createdBy, id)))
        );
      }

      const examIds = teacherExams.map((e) => e.id);
      if (examIds.length === 0) return res.json([]);

      // Get all exam records for these exams
      const records: Array<{
        id: number;
        examId: number;
        studentId: number;
        score: string | null;
        startTime: Date;
        endTime: Date | null;
        status: string | null;
      }> = [];

      for (const examId of examIds) {
        const recs = await db
          .select()
          .from(examRecords)
          .where(eq(examRecords.examId, examId));
        records.push(...recs);
      }

      // Map exam titles
      const examMap = new Map(teacherExams.map((e) => [e.id, e]));

      // Map student names
      const allStudentIds = [...new Set(records.map((r) => r.studentId))];
      const userMap = new Map<number, string>();
      if (allStudentIds.length > 0) {
        const allUsers = await db.select().from(users);
        for (const u of allUsers) {
          userMap.set(u.id, u.name || `学生${u.id}`);
        }
      }

      const result = records.map((r) => {
        const exam = examMap.get(r.examId);
        const durationMinutes = r.endTime
          ? Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000)
          : null;
        return {
          id: r.id,
          examTitle: exam?.title ?? "未知考试",
          studentId: r.studentId,
          studentName: userMap.get(r.studentId) || `学生${r.studentId}`,
          score: Number(r.score ?? 0),
          totalPoints: Number(exam?.totalPoints ?? 0),
          submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
          duration: durationMinutes,
          status: r.status,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("[API] teacher.scores failed:", error);
      res.status(500).json({ error: "获取成绩失败" });
    }
  });

  router.get("/student/scores", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const records = await db
        .select()
        .from(examRecords)
        .where(eq(examRecords.studentId, req.user!.id));

      // Get exam details
      const result = [];
      for (const r of records) {
        const exam = await db.select().from(exams).where(eq(exams.id, r.examId));
        const examRecord = r as typeof r & { status: string | null };
        // 如果是 submitted 状态（有问答题待批改），显示为 pending
        let status: string;
        if (examRecord.status === "submitted") {
          status = "pending";
        } else {
          status = Number(r.score ?? 0) >= Number(exam[0]?.passingScore ?? 60) ? "passed" : "failed";
        }
        result.push({
          id: r.id,
          examTitle: exam[0]?.title ?? "未知考试",
          score: Number(r.score ?? 0),
          totalPoints: Number(exam[0]?.totalPoints ?? 0),
          duration: exam[0]?.duration ?? 0,
          submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
          status,
        });
      }

      res.json(result);
    } catch (error) {
      console.error("[API] student.scores failed:", error);
      res.status(500).json({ error: "获取成绩失败" });
    }
  });

  // Score detail with per-question breakdown
  router.get("/scores/:id/detail", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const recordId = Number(req.params.id);

      // Get exam record
      const record = await db.select().from(examRecords).where(eq(examRecords.id, recordId));
      if (!record.length) return res.status(404).json({ error: "成绩记录不存在" });

      const r = record[0];

      // Get exam info
      const exam = await db.select().from(exams).where(eq(exams.id, r.examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      // Permission check: student can view own record, teacher can view records of their exams and admin-created exams, admin can view all
      const isOwner = r.studentId === req.user!.id;
      const isAdmin = req.user!.role === "admin";
      const isExamOwner = exam[0].createdBy === req.user!.id;
      // 检查试卷创建者是否为管理员（教师可查看管理员创建的试卷）
      let isCreatedByAdmin = false;
      if (!isExamOwner && !isAdmin) {
        const examCreator = await db.select({ role: users.role }).from(users).where(eq(users.id, exam[0].createdBy));
        isCreatedByAdmin = examCreator.length > 0 && examCreator[0].role === "admin";
      }
      if (!isOwner && !isExamOwner && !isAdmin && !isCreatedByAdmin) {
        return res.status(403).json({ error: "无权查看此成绩" });
      }

      // Get student answers with question details
      const answers = await db
        .select()
        .from(studentAnswers)
        .where(eq(studentAnswers.examRecordId, recordId));

      // Get exam question points mapping
      const examQs = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.examId, r.examId));
      const pointsMap = new Map(examQs.map((eq) => [eq.questionId, Number(eq.points)]));

      const questionDetails = [];
      for (const a of answers) {
        const q = await db.select().from(questions).where(eq(questions.id, a.questionId));
        if (q.length) {
          questionDetails.push({
            questionId: a.questionId,
            title: q[0].title,
            type: q[0].type,
            options: q[0].options,
            correctAnswer: q[0].correctAnswer,
            studentAnswer: a.studentAnswer,
            isCorrect: a.isCorrect,
            earnedPoints: Number(a.earnedPoints ?? 0),
            totalPoints: pointsMap.get(a.questionId) ?? Number(q[0].points),
            gradingRubric: q[0].gradingRubric ?? null,
            aiScore: a.aiScore ? Number(a.aiScore) : null,
            aiComment: a.aiComment ?? null,
          });
        }
      }

      res.json({
        recordId: r.id,
        examTitle: exam[0].title,
        score: Number(r.score ?? 0),
        totalPoints: Number(exam[0].totalPoints),
        passingScore: Number(exam[0].passingScore ?? 60),
        status: r.status,
        submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
        questions: questionDetails,
      });
    } catch (error) {
      console.error("[API] scores.detail failed:", error);
      res.status(500).json({ error: "获取成绩详情失败" });
    }
  });

  // ==================== AI Chat ====================

  router.post("/ai/chat", requireAuth, async (req, res) => {
    try {
      const { message, context } = req.body as {
        message: string;
        context?: { questionTitle?: string };
      };

      if (!message?.trim()) {
        return res.status(400).json({ error: "请输入问题" });
      }

      const messages = buildStudentChatMessages(message.trim(), context);
      await streamChat(messages, res);
    } catch (error) {
      console.error("[API] ai.chat failed:", error);
      res.status(500).json({ error: "AI 服务调用失败" });
    }
  });

  // ==================== Teacher AI Grading ====================

  // 检查教师是否有权限批改该考试（自己创建的 或 管理员创建的）
  async function canTeacherGrade(userId: number, userRole: string, examCreatedBy: number): Promise<boolean> {
    if (userRole === "admin") return true;
    if (examCreatedBy === userId) return true;
    // 检查试卷创建者是否为管理员
    const db = await getDb();
    if (!db) return false;
    const creator = await db.select({ role: users.role }).from(users).where(eq(users.id, examCreatedBy));
    return creator.length > 0 && creator[0].role === "admin";
  }

  // AI 评分单个问答题
  router.post("/teacher/ai-grade", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { recordId, questionId } = req.body as { recordId: number; questionId: number };
      if (!recordId || !questionId) {
        return res.status(400).json({ error: "缺少参数" });
      }

      // 获取考试记录，验证教师权限
      const record = await db.select().from(examRecords).where(eq(examRecords.id, recordId));
      if (!record.length) return res.status(404).json({ error: "成绩记录不存在" });

      const exam = await db.select().from(exams).where(eq(exams.id, record[0].examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      if (!await canTeacherGrade(req.user!.id, req.user!.role, exam[0].createdBy)) {
        return res.status(403).json({ error: "无权操作" });
      }

      // 获取题目信息
      const question = await db.select().from(questions).where(eq(questions.id, questionId));
      if (!question.length) return res.status(404).json({ error: "题目不存在" });
      if (question[0].type !== "essay") {
        return res.status(400).json({ error: "只能对问答题进行 AI 评分" });
      }

      // 获取学生答案
      const answer = await db.select().from(studentAnswers).where(
        and(
          eq(studentAnswers.examRecordId, recordId),
          eq(studentAnswers.questionId, questionId)
        )
      );
      if (!answer.length) return res.status(404).json({ error: "未找到学生作答" });

      // 获取该题在考试中的分值
      const examQ = await db.select().from(examQuestions).where(
        and(
          eq(examQuestions.examId, record[0].examId),
          eq(examQuestions.questionId, questionId)
        )
      );
      const totalPoints = examQ.length ? Number(examQ[0].points) : Number(question[0].points);

      // 调用 AI 评分
      const result = await gradeEssay(
        question[0].title,
        question[0].correctAnswer,
        question[0].gradingRubric,
        answer[0].studentAnswer,
        totalPoints
      );

      // 保存 AI 评分结果，同时更新 earnedPoints
      await db.update(studentAnswers).set({
        aiScore: result.score.toString(),
        aiComment: result.comment,
        earnedPoints: result.score.toString(),
      }).where(
        and(
          eq(studentAnswers.examRecordId, recordId),
          eq(studentAnswers.questionId, questionId)
        )
      );

      res.json({ aiScore: result.score, aiComment: result.comment });
    } catch (error) {
      console.error("[API] teacher.ai-grade failed:", error);
      res.status(500).json({ error: "AI 评分失败" });
    }
  });

  // 批量 AI 评分
  router.post("/teacher/batch-ai-grade", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { recordId } = req.body as { recordId: number };
      if (!recordId) return res.status(400).json({ error: "缺少参数" });

      // 获取考试记录，验证权限
      const record = await db.select().from(examRecords).where(eq(examRecords.id, recordId));
      if (!record.length) return res.status(404).json({ error: "成绩记录不存在" });

      const exam = await db.select().from(exams).where(eq(exams.id, record[0].examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      if (!await canTeacherGrade(req.user!.id, req.user!.role, exam[0].createdBy)) {
        return res.status(403).json({ error: "无权操作" });
      }

      // 获取该考试所有问答题的学生答案
      const answers = await db.select().from(studentAnswers).where(
        eq(studentAnswers.examRecordId, recordId)
      );

      const examQs = await db.select().from(examQuestions).where(
        eq(examQuestions.examId, record[0].examId)
      );
      const pointsMap = new Map(examQs.map((eq) => [eq.questionId, Number(eq.points)]));

      let graded = 0;
      const results: Array<{ questionId: number; aiScore: number; aiComment: string }> = [];

      for (const ans of answers) {
        const q = await db.select().from(questions).where(eq(questions.id, ans.questionId));
        if (!q.length || q[0].type !== "essay") continue;
        // 跳过已有 AI 评分的答案
        if (ans.aiScore !== null) continue;

        const totalPoints = pointsMap.get(ans.questionId) ?? Number(q[0].points);

        const result = await gradeEssay(
          q[0].title,
          q[0].correctAnswer,
          q[0].gradingRubric,
          ans.studentAnswer,
          totalPoints
        );

        await db.update(studentAnswers).set({
          aiScore: result.score.toString(),
          aiComment: result.comment,
          earnedPoints: result.score.toString(),
        }).where(
          and(
            eq(studentAnswers.examRecordId, recordId),
            eq(studentAnswers.questionId, ans.questionId)
          )
        );

        results.push({ questionId: ans.questionId, aiScore: result.score, aiComment: result.comment });
        graded++;
      }

      res.json({ success: true, graded, results });
    } catch (error) {
      console.error("[API] teacher.batch-ai-grade failed:", error);
      res.status(500).json({ error: "批量 AI 评分失败" });
    }
  });

  // 教师确认/修改评分
  router.put("/teacher/confirm-grade", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const { recordId, questionId, earnedPoints } = req.body as {
        recordId: number;
        questionId: number;
        earnedPoints: number;
      };

      if (!recordId || !questionId || earnedPoints === undefined) {
        return res.status(400).json({ error: "缺少参数" });
      }

      // 验证权限
      const record = await db.select().from(examRecords).where(eq(examRecords.id, recordId));
      if (!record.length) return res.status(404).json({ error: "成绩记录不存在" });

      const exam = await db.select().from(exams).where(eq(exams.id, record[0].examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      if (!await canTeacherGrade(req.user!.id, req.user!.role, exam[0].createdBy)) {
        return res.status(403).json({ error: "无权操作" });
      }

      // 更新该题得分
      await db.update(studentAnswers).set({
        earnedPoints: earnedPoints.toString(),
        isCorrect: earnedPoints > 0,
      }).where(
        and(
          eq(studentAnswers.examRecordId, recordId),
          eq(studentAnswers.questionId, questionId)
        )
      );

      // 重新计算总分
      const allAnswers = await db.select().from(studentAnswers).where(
        eq(studentAnswers.examRecordId, recordId)
      );
      const totalScore = Math.round(
        allAnswers.reduce((sum, a) => sum + Number(a.earnedPoints ?? 0), 0) * 10
      ) / 10;

      await db.update(examRecords).set({
        score: totalScore.toString(),
      }).where(eq(examRecords.id, recordId));

      res.json({ success: true, score: totalScore });
    } catch (error) {
      console.error("[API] teacher.confirm-grade failed:", error);
      res.status(500).json({ error: "确认评分失败" });
    }
  });

  // 教师批量确认所有问答题评分（将 submitted 改为 graded）
  router.put("/teacher/confirm-all/:recordId", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const recordId = Number(req.params.recordId);

      const record = await db.select().from(examRecords).where(eq(examRecords.id, recordId));
      if (!record.length) return res.status(404).json({ error: "成绩记录不存在" });

      const exam = await db.select().from(exams).where(eq(exams.id, record[0].examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      if (!await canTeacherGrade(req.user!.id, req.user!.role, exam[0].createdBy)) {
        return res.status(403).json({ error: "无权操作" });
      }

      // 重新计算总分
      const allAnswers = await db.select().from(studentAnswers).where(
        eq(studentAnswers.examRecordId, recordId)
      );
      const totalScore = Math.round(
        allAnswers.reduce((sum, a) => sum + Number(a.earnedPoints ?? 0), 0) * 10
      ) / 10;

      await db.update(examRecords).set({
        score: totalScore.toString(),
        status: "graded",
      }).where(eq(examRecords.id, recordId));

      res.json({ success: true, score: totalScore });
    } catch (error) {
      console.error("[API] teacher.confirmAll failed:", error);
      res.status(500).json({ error: "确认评分失败" });
    }
  });

  // ==================== Admin ====================

  function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user) {
      res.status(401).json({ error: "请先登录" });
      return;
    }
    if (req.user.role !== "admin") {
      res.status(403).json({ error: "需要管理员权限" });
      return;
    }
    next();
  }

  router.get("/admin/stats", requireAdmin, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json({ users: 0, questions: 0, exams: 0, records: 0 });

      const [uc] = await db.select({ count: count() }).from(users);
      const [qc] = await db.select({ count: count() }).from(questions).where(isNull(questions.deletedAt));
      const [ec] = await db.select({ count: count() }).from(exams);
      const [rc] = await db.select({ count: count() }).from(examRecords);

      res.json({
        users: Number(uc.count),
        questions: Number(qc.count),
        exams: Number(ec.count),
        records: Number(rc.count),
      });
    } catch (error) {
      console.error("[API] admin.stats failed:", error);
      res.status(500).json({ error: "获取统计数据失败" });
    }
  });

  router.get("/admin/users", requireAdmin, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const result = await db.select().from(users);
      res.json(result);
    } catch (error) {
      console.error("[API] admin.users failed:", error);
      res.status(500).json({ error: "获取用户列表失败" });
    }
  });

  router.get("/admin/questions", requireAdmin, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const result = await db.select().from(questions).where(isNull(questions.deletedAt));
      res.json(result);
    } catch (error) {
      console.error("[API] admin.questions failed:", error);
      res.status(500).json({ error: "获取题目列表失败" });
    }
  });

  router.get("/admin/exams", requireAdmin, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const result = await db.select().from(exams);
      res.json(result);
    } catch (error) {
      console.error("[API] admin.exams failed:", error);
      res.status(500).json({ error: "获取试卷列表失败" });
    }
  });

  router.get("/admin/scores", requireAdmin, async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);

      const records = await db.select().from(examRecords);
      const allExams = await db.select().from(exams);
      const allUsers = await db.select().from(users);
      const examMap = new Map(allExams.map((e) => [e.id, e]));
      const userMap = new Map(allUsers.map((u) => [u.id, u]));

      const result = records.map((r) => {
        const exam = examMap.get(r.examId);
        const student = userMap.get(r.studentId);
        const durationMinutes = r.endTime
          ? Math.round((new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) / 60000)
          : null;
        return {
          id: r.id,
          examTitle: exam?.title ?? "未知考试",
          studentName: student?.name ?? `学生${r.studentId}`,
          score: Number(r.score ?? 0),
          totalPoints: Number(exam?.totalPoints ?? 0),
          submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
          duration: durationMinutes,
          status: r.status,
        };
      });

      res.json(result);
    } catch (error) {
      console.error("[API] admin.scores failed:", error);
      res.status(500).json({ error: "获取成绩列表失败" });
    }
  });

  router.post("/admin/init-accounts", requireAdmin, async (_req, res) => {
    try {
      const accounts: Array<{ openId: string; name: string; email: string; role: "teacher" | "student" }> = [
        { openId: "local_teacher", name: "教师", email: "local_teacher@local.com", role: "teacher" },
        { openId: "local_student", name: "学生1", email: "local_student@local.com", role: "student" },
        { openId: "local_student2", name: "学生2", email: "local_student2@local.com", role: "student" },
        { openId: "local_student3", name: "学生3", email: "local_student3@local.com", role: "student" },
      ];

      for (const acc of accounts) {
        const existing = await getUserByOpenId(acc.openId);
        if (!existing) {
          await upsertUser({
            ...acc,
            loginMethod: "local",
            lastSignedIn: new Date(),
          });
        }
      }

      // 删除旧的重复账号 & 迁移旧数据 & 修复旧用户名
      const db = await getDb();
      if (db) {
        const allUsers = await db.select().from(users);
        const oldUser = allUsers.find(u => u.openId === "dev_local_user");
        const newTeacher = allUsers.find(u => u.openId === "local_teacher");

        // 将旧用户创建的题目和试卷迁移到新教师账号
        if (oldUser && newTeacher && oldUser.id !== newTeacher.id) {
          await db.update(questions).set({ createdBy: newTeacher.id }).where(eq(questions.createdBy, oldUser.id));
          await db.update(exams).set({ createdBy: newTeacher.id, status: "published" }).where(eq(exams.createdBy, oldUser.id));
        }

        for (const u of allUsers) {
          // 删除旧的共享 openId 和旧格式学生账号
          if (u.openId === "dev_local_user" || u.openId.startsWith("student_")) {
            await db.delete(users).where(eq(users.id, u.id));
            continue;
          }
          // 修复旧的学生中文数字名
          if (u.role === "student" && u.name && ["学生", "学生一", "学生二", "学生三", "本地开发用户"].includes(u.name)) {
            await db.update(users).set({ name: "学生1" }).where(eq(users.id, u.id));
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("[API] admin.initAccounts failed:", error);
      res.status(500).json({ error: "初始化账号失败" });
    }
  });

  router.put("/admin/scores/:recordId", requireAdmin, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const recordId = Number(req.params.recordId);
      const { scores: scoreUpdates } = req.body as {
        scores: { questionId: number; earnedPoints: number }[];
      };

      if (!Array.isArray(scoreUpdates)) {
        return res.status(400).json({ error: "参数格式错误" });
      }

      // Update each student answer's earned points
      for (const update of scoreUpdates) {
        await db
          .update(studentAnswers)
          .set({
            earnedPoints: update.earnedPoints.toString(),
            isCorrect: update.earnedPoints > 0,
          })
          .where(
            and(
              eq(studentAnswers.examRecordId, recordId),
              eq(studentAnswers.questionId, update.questionId)
            )
          );
      }

      // Recalculate total score
      const answers = await db
        .select()
        .from(studentAnswers)
        .where(eq(studentAnswers.examRecordId, recordId));

      const totalScore = Math.round(
        answers.reduce((sum, a) => sum + Number(a.earnedPoints ?? 0), 0) * 10
      ) / 10;

      await db
        .update(examRecords)
        .set({ score: totalScore.toString() })
        .where(eq(examRecords.id, recordId));

      res.json({ success: true, score: totalScore });
    } catch (error) {
      console.error("[API] admin.updateScore failed:", error);
      res.status(500).json({ error: "修改成绩失败" });
    }
  });

  router.delete("/admin/scores/:recordId", requireAdmin, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.status(500).json({ error: "数据库不可用" });

      const recordId = Number(req.params.recordId);

      await db.transaction(async (tx) => {
        await tx.delete(studentAnswers).where(eq(studentAnswers.examRecordId, recordId));
        await tx.delete(examRecords).where(eq(examRecords.id, recordId));
      });

      res.json({ success: true });
    } catch (error) {
      console.error("[API] admin.deleteScore failed:", error);
      res.status(500).json({ error: "删除成绩失败" });
    }
  });

  return router;
}
