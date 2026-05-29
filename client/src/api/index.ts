import axios from "axios";
import type {
  User,
  Question,
  Exam,
  ExamWithQuestions,
  TeacherScore,
  StudentScore,
} from "../types";

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
  timeout: 30000,
});

// Attach login role header for dev auth
api.interceptors.request.use((config) => {
  const role = localStorage.getItem("loginRole");
  if (role) {
    config.headers["x-login-role"] = role;
  }
  return config;
});

// Auth
export const authApi = {
  me: () => api.get<User | null>("/auth/me").then((r) => r.data),
  login: (username: string, password: string) =>
    api.post<User>("/auth/login", { username, password }).then((r) => r.data),
  logout: () => api.post("/auth/logout").then((r) => r.data),
};

// Questions
export const questionsApi = {
  list: () => api.get<Question[]>("/questions").then((r) => r.data),
  create: (data: {
    type: string;
    title: string;
    options?: Record<string, string>;
    correctAnswer: string;
    explanation?: string;
    difficulty?: string;
    category?: string;
    points?: number;
  }) => api.post<{ success: boolean; id: number }>("/questions", data).then((r) => r.data),
  update: (
    id: number,
    data: Partial<{
      title: string;
      options: Record<string, string>;
      correctAnswer: string;
      explanation: string;
      difficulty: string;
      category: string;
      points: number;
    }>
  ) => api.put<{ success: boolean }>(`/questions/${id}`, data).then((r) => r.data),
  delete: (id: number) => api.delete<{ success: boolean }>(`/questions/${id}`).then((r) => r.data),
};

// Exams
export const examsApi = {
  list: () => api.get<Exam[]>("/exams").then((r) => r.data),
  create: (data: {
    title: string;
    description?: string;
    totalPoints: number;
    duration: number;
    startTime?: string;
    endTime?: string;
    passingScore?: number;
    questionIds: number[];
    questionPoints?: number[];
    allowRetake?: boolean;
  }) => api.post<{ success: boolean; id: number }>("/exams", data).then((r) => r.data),
  publish: (id: number) =>
    api.post<{ success: boolean }>(`/exams/${id}/publish`).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/exams/${id}`).then((r) => r.data),
};

// Student exams
export const studentExamsApi = {
  listAvailable: () => api.get<(Exam & { hasTaken: boolean })[]>("/student/exams").then((r) => r.data),
  getExam: (id: number) =>
    api.get<ExamWithQuestions>(`/student/exams/${id}`).then((r) => r.data),
  submit: (
    id: number,
    data: { answers: Record<number, string>; startTime: string }
  ) =>
    api
      .post<{ success: boolean; recordId: number; score: number; totalPoints: number }>(
        `/student/exams/${id}/submit`,
        data
      )
      .then((r) => r.data),
  practiceQuestions: () =>
    api.get<(Question & { correctAnswer: string; explanation: string | null })[]>(
      "/student/practice/questions"
    ).then((r) => r.data),
};

// Scores
export interface ScoreDetail {
  recordId: number;
  examTitle: string;
  score: number;
  totalPoints: number;
  passingScore: number;
  status: string | null;
  submittedAt: string;
  questions: {
    questionId: number;
    title: string;
    type: string;
    options: Record<string, string> | null;
    correctAnswer: string;
    studentAnswer: string;
    isCorrect: boolean | null;
    earnedPoints: number;
    totalPoints: number;
  }[];
}

export const scoresApi = {
  teacher: () => api.get<TeacherScore[]>("/teacher/scores").then((r) => r.data),
  student: () => api.get<StudentScore[]>("/student/scores").then((r) => r.data),
  detail: (recordId: number) => api.get<ScoreDetail>(`/scores/${recordId}/detail`).then((r) => r.data),
};

// Admin
export interface AdminStats {
  users: number;
  questions: number;
  exams: number;
  records: number;
}

export interface AdminUser {
  id: number;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
}

export interface AdminScore {
  id: number;
  examTitle: string;
  studentName: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  duration: number | null;
  status: string | null;
}

export const adminApi = {
  stats: () => api.get<AdminStats>("/admin/stats").then((r) => r.data),
  users: () => api.get<AdminUser[]>("/admin/users").then((r) => r.data),
  questions: () => api.get<Question[]>("/admin/questions").then((r) => r.data),
  exams: () => api.get<Exam[]>("/admin/exams").then((r) => r.data),
  scores: () => api.get<AdminScore[]>("/admin/scores").then((r) => r.data),
  initAccounts: () => api.post<{ success: boolean }>("/admin/init-accounts").then((r) => r.data),
  updateScore: (recordId: number, scores: { questionId: number; earnedPoints: number }[]) =>
    api.put<{ success: boolean; score: number }>(`/admin/scores/${recordId}`, { scores }).then((r) => r.data),
  deleteScore: (recordId: number) =>
    api.delete<{ success: boolean }>(`/admin/scores/${recordId}`).then((r) => r.data),
};

export default api;
