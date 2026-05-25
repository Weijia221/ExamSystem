import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { getDb } from "./db";
import { questions, exams, examQuestions, examRecords, studentAnswers } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Question management for teachers
  questions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(questions).where(eq(questions.createdBy, ctx.user.id));
    }),

    create: protectedProcedure
      .input(
        z.object({
          type: z.enum(["single", "multiple", "trueFalse", "fillBlank"]),
          title: z.string().min(1),
          options: z.record(z.string(), z.string()).optional(),
          correctAnswer: z.string().min(1),
          explanation: z.string().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
          category: z.string().optional(),
          points: z.number().default(1),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(questions).values({
          createdBy: ctx.user.id,
          type: input.type,
          title: input.title,
          options: input.options,
          correctAnswer: input.correctAnswer,
          explanation: input.explanation,
          difficulty: input.difficulty,
          category: input.category,
          points: input.points.toString(),
        });

        const insertId = Number((result as { insertId?: number }).insertId ?? 0);
        return { success: true, id: insertId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          options: z.record(z.string(), z.string()).optional(),
          correctAnswer: z.string().optional(),
          explanation: z.string().optional(),
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          category: z.string().optional(),
          points: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const updateData: any = {};
        if (input.title) updateData.title = input.title;
        if (input.options) updateData.options = input.options;
        if (input.correctAnswer) updateData.correctAnswer = input.correctAnswer;
        if (input.explanation) updateData.explanation = input.explanation;
        if (input.difficulty) updateData.difficulty = input.difficulty;
        if (input.category) updateData.category = input.category;
        if (input.points) updateData.points = input.points.toString();

        await db
          .update(questions)
          .set(updateData)
          .where(and(
            eq(questions.id, input.id),
            eq(questions.createdBy, ctx.user.id)
          ));

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .delete(questions)
          .where(and(
            eq(questions.id, input.id),
            eq(questions.createdBy, ctx.user.id)
          ));

        return { success: true };
      }),
  }),

  // Exam management for teachers
  exams: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];
      return db.select().from(exams).where(eq(exams.createdBy, ctx.user.id));
    }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1),
          description: z.string().optional(),
          totalPoints: z.number().positive(),
          duration: z.number().positive(),
          startTime: z.date().optional(),
          endTime: z.date().optional(),
          passingScore: z.number().optional(),
          questionIds: z.array(z.number()),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(exams).values({
          createdBy: ctx.user.id,
          title: input.title,
          description: input.description,
          totalPoints: input.totalPoints.toString(),
          duration: input.duration,
          startTime: input.startTime,
          endTime: input.endTime,
          passingScore: input.passingScore?.toString(),
          status: "draft",
        });

        const examId = (result as any).insertId || 1;

        // Add questions to exam
        for (let i = 0; i < input.questionIds.length; i++) {
          await db.insert(examQuestions).values({
            examId: Number(examId),
            questionId: input.questionIds[i],
            order: i + 1,
            points: "1",
          });
        }

        return { id: Number(examId) };
      }),

    publish: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        await db
          .update(exams)
          .set({ status: "published" })
          .where(and(
            eq(exams.id, input.id),
            eq(exams.createdBy, ctx.user.id)
          ));

        return { success: true };
      }),
  }),

  // Student exam taking
  studentExams: router({
    listAvailable: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(exams)
        .where(eq(exams.status, "published"));
    }),

    getExamWithQuestions: protectedProcedure
      .input(z.object({ examId: z.number() }))
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return null;

        const exam = await db.select().from(exams).where(eq(exams.id, input.examId));
        if (!exam.length) return null;

        const examQs = await db
          .select()
          .from(examQuestions)
          .where(eq(examQuestions.examId, input.examId));

        return {
          exam: exam[0],
          questions: examQs,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
