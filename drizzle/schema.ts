import { 
  int, 
  mysqlEnum, 
  mysqlTable, 
  text, 
  timestamp, 
  varchar,
  boolean,
  decimal,
  json
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with role field to distinguish teachers and students.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "teacher", "student"]).default("student").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Question table for storing all questions in the question bank
 * Supports multiple question types: single choice, multiple choice, true/false, fill-in-the-blank
 */
export const questions = mysqlTable("questions", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(), // Teacher who created this question
  type: mysqlEnum("type", ["single", "multiple", "trueFalse", "fillBlank"]).notNull(),
  title: text("title").notNull(), // Question content
  options: json("options"), // For single/multiple/trueFalse: {A: "...", B: "...", ...}
  correctAnswer: text("correctAnswer").notNull(), // For single: "A", multiple: "A,B", trueFalse: "true"/"false", fillBlank: "answer1|answer2"
  explanation: text("explanation"), // Answer explanation
  difficulty: mysqlEnum("difficulty", ["easy", "medium", "hard"]).default("medium"),
  category: varchar("category", { length: 100 }), // Question category for organization
  points: decimal("points", { precision: 5, scale: 2 }).default("1"), // Default points
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Question = typeof questions.$inferSelect;
export type InsertQuestion = typeof questions.$inferInsert;

/**
 * Exam (Paper) table for storing published exams
 * Teachers create exams by selecting questions from the question bank
 */
export const exams = mysqlTable("exams", {
  id: int("id").autoincrement().primaryKey(),
  createdBy: int("createdBy").notNull(), // Teacher who created this exam
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  totalPoints: decimal("totalPoints", { precision: 8, scale: 2 }).notNull(),
  duration: int("duration").notNull(), // Duration in minutes
  startTime: timestamp("startTime"), // When the exam becomes available
  endTime: timestamp("endTime"), // When the exam is no longer available
  passingScore: decimal("passingScore", { precision: 8, scale: 2 }), // Passing score
  status: mysqlEnum("status", ["draft", "published", "closed"]).default("draft"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Exam = typeof exams.$inferSelect;
export type InsertExam = typeof exams.$inferInsert;

/**
 * ExamQuestion table for mapping questions to exams
 * Stores the order and points for each question in an exam
 */
export const examQuestions = mysqlTable("examQuestions", {
  id: int("id").autoincrement().primaryKey(),
  examId: int("examId").notNull(),
  questionId: int("questionId").notNull(),
  order: int("order").notNull(), // Order of question in exam
  points: decimal("points", { precision: 5, scale: 2 }).notNull(), // Points for this question in this exam
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ExamQuestion = typeof examQuestions.$inferSelect;
export type InsertExamQuestion = typeof examQuestions.$inferInsert;

/**
 * ExamRecord table for tracking student exam attempts
 * Records when a student takes an exam
 */
export const examRecords = mysqlTable("examRecords", {
  id: int("id").autoincrement().primaryKey(),
  examId: int("examId").notNull(),
  studentId: int("studentId").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"), // When student submitted or time expired
  score: decimal("score", { precision: 8, scale: 2 }), // Final score
  status: mysqlEnum("status", ["in_progress", "submitted", "graded"]).default("in_progress"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExamRecord = typeof examRecords.$inferSelect;
export type InsertExamRecord = typeof examRecords.$inferInsert;

/**
 * StudentAnswer table for storing individual question answers
 * Records student's answer to each question
 */
export const studentAnswers = mysqlTable("studentAnswers", {
  id: int("id").autoincrement().primaryKey(),
  examRecordId: int("examRecordId").notNull(),
  questionId: int("questionId").notNull(),
  studentAnswer: text("studentAnswer").notNull(), // Student's answer
  isCorrect: boolean("isCorrect"), // Whether answer is correct
  earnedPoints: decimal("earnedPoints", { precision: 5, scale: 2 }), // Points earned for this question
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type StudentAnswer = typeof studentAnswers.$inferSelect;
export type InsertStudentAnswer = typeof studentAnswers.$inferInsert;

/**
 * PracticeRecord table for tracking practice sessions
 * Records when a student practices with random questions
 */
export const practiceRecords = mysqlTable("practiceRecords", {
  id: int("id").autoincrement().primaryKey(),
  studentId: int("studentId").notNull(),
  questionId: int("questionId").notNull(),
  studentAnswer: text("studentAnswer").notNull(),
  isCorrect: boolean("isCorrect").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PracticeRecord = typeof practiceRecords.$inferSelect;
export type InsertPracticeRecord = typeof practiceRecords.$inferInsert;
