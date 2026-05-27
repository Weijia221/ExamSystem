import { COOKIE_NAME } from "@shared/const";
import { Router, type Request, type Response, type NextFunction } from "express";
import { getDb, getUserByOpenId, upsertUser } from "./db";
import { sdk } from "./_core/sdk";
import { getSessionCookieOptions } from "./_core/cookies";
import { ENV } from "./_core/env";
import {
  users,
  questions,
  exams,
  examQuestions,
  examRecords,
  studentAnswers,
  type User,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Dev user auto-login when OAuth is not configured
const DEV_OPEN_ID = "dev_local_user";

async function getDevUser(): Promise<User | null> {
  const db = await getDb();
  if (!db) return null;

  let user = await getUserByOpenId(DEV_OPEN_ID);
  if (!user) {
    await upsertUser({
      openId: DEV_OPEN_ID,
      name: "本地开发用户",
      email: "dev@local.com",
      loginMethod: "local",
      role: "teacher",
      lastSignedIn: new Date(),
    });
    user = await getUserByOpenId(DEV_OPEN_ID);
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
      req.user = await getDevUser();
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
      const result = await db
        .select()
        .from(questions)
        .where(eq(questions.createdBy, req.user!.id));
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

      const { type, title, options, correctAnswer, explanation, difficulty, category, points } = req.body;

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
      const { title, options, correctAnswer, explanation, difficulty, category, points } = req.body;

      const updateData: Record<string, unknown> = {};
      if (title !== undefined) updateData.title = title;
      if (options !== undefined) updateData.options = options;
      if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;
      if (explanation !== undefined) updateData.explanation = explanation;
      if (difficulty !== undefined) updateData.difficulty = difficulty;
      if (category !== undefined) updateData.category = category;
      if (points !== undefined) updateData.points = points.toString();

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

      await db.transaction(async (tx) => {
        // Remove associations from examQuestions first
        await tx.delete(examQuestions).where(eq(examQuestions.questionId, id));
        // Then delete the question itself
        await tx
          .delete(questions)
          .where(and(eq(questions.id, id), eq(questions.createdBy, req.user!.id)));
      });

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
      const result = await db
        .select()
        .from(exams)
        .where(eq(exams.createdBy, req.user!.id));
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

      const { title, description, totalPoints, duration, startTime, endTime, passingScore, questionIds } = req.body;

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
      });

      const rawInsertId = (result as any).insertId ?? (result as any)[0]?.insertId ?? 0;
      const examId = Number(rawInsertId);
      console.log("[DEBUG] create exam raw result keys =", Object.keys(result as any));
      console.log("[DEBUG] create exam examId =", examId, "questionIds =", questionIds);

      if (!examId || examId === 0) {
        console.error("[DEBUG] examId is invalid! Falling back to query");
        const lastExam = await db.select({ id: exams.id }).from(exams).where(eq(exams.createdBy, req.user!.id));
        const fallbackId = lastExam.length > 0 ? Math.max(...lastExam.map(e => e.id)) : 0;
        console.log("[DEBUG] fallback examId =", fallbackId);
        if (fallbackId > 0) {
          for (let i = 0; i < questionIds.length; i++) {
            await db.insert(examQuestions).values({ examId: fallbackId, questionId: questionIds[i], order: i + 1, points: "1" });
          }
        }
        return res.json({ success: true, id: fallbackId });
      }

      for (let i = 0; i < questionIds.length; i++) {
        await db.insert(examQuestions).values({
          examId,
          questionId: questionIds[i],
          order: i + 1,
          points: "1",
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

  // ==================== Student Exams ====================

  router.get("/student/exams", requireAuth, async (req, res) => {
    try {
      const db = await getDb();
      if (!db) return res.json([]);
      const result = await db
        .select()
        .from(exams)
        .where(eq(exams.status, "published"));
      res.json(result);
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
      console.log("[DEBUG] student/exams/:id examId =", examId);

      const exam = await db.select().from(exams).where(eq(exams.id, examId));
      if (!exam.length) return res.status(404).json({ error: "考试不存在" });

      const examQs = await db
        .select()
        .from(examQuestions)
        .where(eq(examQuestions.examId, examId));

      console.log("[DEBUG] examQs count =", examQs.length, JSON.stringify(examQs));

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

      console.log("[DEBUG] questionsData count =", questionsData.length);
      if (questionsData.length > 0) {
        console.log("[DEBUG] sample question keys =", Object.keys(questionsData[0]));
        console.log("[DEBUG] sample options type =", typeof questionsData[0].options, questionsData[0].options);
      }

      res.json({
        exam: exam[0],
        questions: questionsData,
      });
    } catch (error) {
      console.error("[API] studentExams.getExamWithQuestions failed:", error);
      res.status(500).json({ error: "获取考试详情失败" });
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
      const recordId = Number((recordResult as { insertId?: number }).insertId ?? 0);

      let totalScore = 0;

      // Grade each answer
      for (const examQ of examQs) {
        const q = await db.select().from(questions).where(eq(questions.id, examQ.questionId));
        if (!q.length) continue;

        const question = q[0];
        const studentAnswer = answers[examQ.questionId] ?? "";
        let isCorrect = false;
        let earnedPoints = 0;

        if (question.type === "single" || question.type === "trueFalse") {
          isCorrect = studentAnswer === question.correctAnswer;
        } else if (question.type === "multiple") {
          const correctSet = new Set(question.correctAnswer.split(",").filter(Boolean));
          const answerSet = new Set(studentAnswer.split("").filter(Boolean));
          isCorrect =
            correctSet.size === answerSet.size &&
            [...correctSet].every((a) => answerSet.has(a));
        } else if (question.type === "fillBlank") {
          const correctAnswers = question.correctAnswer.split("|").map((a) => a.trim().toLowerCase());
          isCorrect = correctAnswers.includes(studentAnswer.trim().toLowerCase());
        }

        if (isCorrect) {
          earnedPoints = Number(examQ.points);
          totalScore += earnedPoints;
        }

        await db.insert(studentAnswers).values({
          examRecordId: recordId,
          questionId: examQ.questionId,
          studentAnswer,
          isCorrect,
          earnedPoints: earnedPoints.toString(),
        });
      }

      // Update exam record with score
      await db
        .update(examRecords)
        .set({ score: totalScore.toString(), status: "graded" })
        .where(eq(examRecords.id, recordId));

      res.json({
        success: true,
        recordId,
        score: totalScore,
        totalPoints: Number(exam[0].totalPoints),
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

      // Get all exams by this teacher
      const teacherExams = await db
        .select()
        .from(exams)
        .where(eq(exams.createdBy, req.user!.id));

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

      const result = records.map((r) => {
        const exam = examMap.get(r.examId);
        return {
          id: r.id,
          examTitle: exam?.title ?? "未知考试",
          studentId: r.studentId,
          score: Number(r.score ?? 0),
          totalPoints: Number(exam?.totalPoints ?? 0),
          submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
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
        result.push({
          id: r.id,
          examTitle: exam[0]?.title ?? "未知考试",
          score: Number(r.score ?? 0),
          totalPoints: Number(exam[0]?.totalPoints ?? 0),
          duration: exam[0]?.duration ?? 0,
          submittedAt: r.endTime ? new Date(r.endTime).toLocaleString("zh-CN") : "-",
          status: Number(r.score ?? 0) >= Number(exam[0]?.passingScore ?? 60) ? "passed" : "failed",
        });
      }

      res.json(result);
    } catch (error) {
      console.error("[API] student.scores failed:", error);
      res.status(500).json({ error: "获取成绩失败" });
    }
  });

  return router;
}
