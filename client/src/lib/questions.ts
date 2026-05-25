export const QUESTIONS_STORAGE_KEY = "exam_system_questions";

export type QuestionType = "single" | "multiple" | "trueFalse" | "fillBlank";

export interface TeacherQuestion {
  id: number;
  type: QuestionType;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
  points: number;
  options?: Record<string, string>;
  correctAnswer: string;
  explanation?: string;
}

export function loadQuestionsFromStorage(): TeacherQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TeacherQuestion[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQuestionsToStorage(list: TeacherQuestion[]) {
  localStorage.setItem(QUESTIONS_STORAGE_KEY, JSON.stringify(list));
}

function parseOptions(
  options: Record<string, string> | string | null | undefined
): Record<string, string> | undefined {
  if (!options) return undefined;
  if (typeof options === "string") {
    try {
      return JSON.parse(options) as Record<string, string>;
    } catch {
      return undefined;
    }
  }
  return options;
}

export function mapDbQuestion(row: {
  id: number;
  type: QuestionType;
  title: string;
  difficulty: "easy" | "medium" | "hard" | null;
  category: string | null;
  points: string | null;
  options: unknown;
  correctAnswer: string;
  explanation: string | null;
}): TeacherQuestion {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    difficulty: row.difficulty ?? "medium",
    category: row.category ?? undefined,
    points: parseFloat(row.points ?? "1") || 1,
    options: parseOptions(
      row.options as Record<string, string> | string | null | undefined
    ),
    correctAnswer: row.correctAnswer,
    explanation: row.explanation ?? undefined,
  };
}

export function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    single: "单选题",
    multiple: "多选题",
    trueFalse: "判断题",
    fillBlank: "填空题",
  };
  return labels[type] || type;
}

export function getDifficultyLabel(difficulty: string) {
  if (difficulty === "easy") return "简单";
  if (difficulty === "hard") return "困难";
  return "中等";
}
