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

// Auth
export const authApi = {
  me: () => api.get<User | null>("/auth/me").then((r) => r.data),
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
  }) => api.post<{ success: boolean; id: number }>("/exams", data).then((r) => r.data),
  publish: (id: number) =>
    api.post<{ success: boolean }>(`/exams/${id}/publish`).then((r) => r.data),
  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/exams/${id}`).then((r) => r.data),
};

// Student exams
export const studentExamsApi = {
  listAvailable: () => api.get<Exam[]>("/student/exams").then((r) => r.data),
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
};

// Scores
export const scoresApi = {
  teacher: () => api.get<TeacherScore[]>("/teacher/scores").then((r) => r.data),
  student: () => api.get<StudentScore[]>("/student/scores").then((r) => r.data),
};

export default api;
