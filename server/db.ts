import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, questions, exams, examRecords, practiceRecords } from "../drizzle/schema";
import { ENV } from './_core/env';
import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import mysql2 from "mysql2/promise";

let _db: ReturnType<typeof drizzle> | null = null;

// Auto-run migrations on startup (dev mode only)
export async function runMigrationsIfNeeded(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  const migrationsDir = join(import.meta.dirname, "..", "drizzle");
  if (!existsSync(migrationsDir)) {
    console.log("[Migrations] No drizzle directory found, skipping");
    return;
  }

  try {
    // Parse mysql://user:password@host:port/database
    const match = process.env.DATABASE_URL.match(/^mysql:\/\/([^:]*):([^@]*)@([^:]+)(?::(\d+))?\/?(\S+)?$/);
    if (!match) { console.warn("[Migrations] Cannot parse DATABASE_URL"); return; }
    const [, user, pass, host, port, dbName] = match;
    const baseUrl = `mysql://${user}:${pass}@${host}${port ? ':' + port : ''}`;

    // First connect without database to create it if needed
    if (dbName) {
      const baseConn = await mysql2.createConnection(baseUrl);
      await baseConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      await baseConn.end();
      console.log(`[Migrations] Database '${dbName}' ready`);
    }

    const conn = await mysql2.createConnection(process.env.DATABASE_URL);
    const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
    if ((tables as any[]).length > 0) {
      console.log("[Migrations] Tables already exist, skipping");
      await conn.end();
      return;
    }

    console.log("[Migrations] First run detected, running migrations...");
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), "utf-8");
      console.log(`[Migrations] Executing ${file}...`);
      const statements = sql.split("--> statement-breakpoint");
      for (const stmt of statements) {
        const trimmed = stmt.trim();
        if (trimmed) await conn.query(trimmed);
      }
    }

    console.log("[Migrations] All migrations applied successfully");
    await conn.end();
  } catch (error) {
    console.warn("[Migrations] Migration failed:", error);
  }
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function checkDbConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    console.error("[Database] DATABASE_URL 未配置，所有数据操作将不可用");
    return false;
  }
  try {
    const db = await getDb();
    if (!db) return false;
    await db.execute("SELECT 1");
    console.log("[Database] 数据库连接成功");
    return true;
  } catch (error) {
    console.error("[Database] 数据库连接失败:", error);
    return false;
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Feature queries for exam system

export async function getQuestionsByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questions).where(eq(questions.createdBy, teacherId));
}

export async function getExamsByTeacher(teacherId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(exams).where(eq(exams.createdBy, teacherId));
}

export async function getExamWithQuestions(examId: number) {
  const db = await getDb();
  if (!db) return null;
  // This would require joins, implement in routers.ts
  return null;
}

export async function getStudentExamRecords(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(examRecords).where(eq(examRecords.studentId, studentId));
}

export async function getPracticeRecordsByStudent(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(practiceRecords).where(eq(practiceRecords.studentId, studentId));
}
