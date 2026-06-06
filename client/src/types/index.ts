export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  loginMethod: string | null;
  role: "user" | "admin" | "teacher" | "student";
  createdAt: string;
  updatedAt: string;
  lastSignedIn: string;
}

export type QuestionType = "single" | "multiple" | "trueFalse" | "fillBlank" | "essay";
export type Difficulty = "easy" | "medium" | "hard";

export interface Question {
  id: number;
  createdBy: number;
  type: QuestionType;
  title: string;
  options: Record<string, string> | null;
  correctAnswer: string;
  explanation: string | null;
  difficulty: Difficulty;
  category: string | null;
  points: string;
  gradingRubric: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: number;
  createdBy: number;
  title: string;
  description: string | null;
  totalPoints: string;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  passingScore: string | null;
  status: "draft" | "published" | "closed" | null;
  allowRetake: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestion {
  id: number;
  examId: number;
  questionId: number;
  order: number;
  points: string;
  createdAt: string;
}

export interface ExamRecord {
  id: number;
  examId: number;
  studentId: number;
  startTime: string;
  endTime: string | null;
  score: string | null;
  status: "in_progress" | "submitted" | "graded" | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  id: number;
  examRecordId: number;
  questionId: number;
  studentAnswer: string;
  isCorrect: boolean | null;
  earnedPoints: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamWithQuestions {
  exam: Exam;
  questions: (Question & { order: number; examPoints: string })[];
}

export interface TeacherScore {
  id: number;
  examTitle: string;
  studentId: number;
  studentName: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  duration: number | null;
  status: string | null;
}

export interface StudentScore {
  id: number;
  examTitle: string;
  score: number;
  totalPoints: number;
  duration: number;
  submittedAt: string;
  status: "passed" | "failed" | "pending";
}
