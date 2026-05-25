import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

import {
  loadQuestionsFromStorage,
  mapDbQuestion,
  saveQuestionsToStorage,
  getTypeLabel,
  type QuestionType,
  type TeacherQuestion,
} from "@/lib/questions";

type Question = TeacherQuestion;

const OPTION_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface OptionItem {
  key: string;
  text: string;
}

function getDefaultOptions(type: QuestionType): OptionItem[] {
  if (type === "trueFalse") {
    return [
      { key: "A", text: "正确" },
      { key: "B", text: "错误" },
    ];
  }
  return [
    { key: "A", text: "" },
    { key: "B", text: "" },
    { key: "C", text: "" },
    { key: "D", text: "" },
  ];
}

function optionsRecordToList(options?: Record<string, string>): OptionItem[] {
  if (!options || Object.keys(options).length === 0) {
    return [];
  }
  return Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, text]) => ({ key, text }));
}

function optionsListToRecord(list: OptionItem[]): Record<string, string> {
  return Object.fromEntries(list.map((o) => [o.key, o.text]));
}

type FormData = {
  type: QuestionType;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  points: number;
  options: OptionItem[];
  correctAnswer: string;
  explanation: string;
  fillBlankAnswer: string;
};

function getEmptyForm(type: QuestionType = "single"): FormData {
  return {
    type,
    title: "",
    difficulty: "medium",
    category: "",
    points: 1,
    options: getDefaultOptions(type),
    correctAnswer: "",
    explanation: "",
    fillBlankAnswer: "",
  };
}

function needsOptions(type: QuestionType) {
  return type === "single" || type === "multiple" || type === "trueFalse";
}

function toApiInput(payload: Omit<Question, "id">) {
  return {
    type: payload.type,
    title: payload.title,
    options: payload.options,
    correctAnswer: payload.correctAnswer,
    explanation: payload.explanation,
    difficulty: payload.difficulty,
    category: payload.category,
    points: payload.points,
  };
}

export default function QuestionBank() {
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const listQuery = trpc.questions.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.questions.create.useMutation();
  const updateMutation = trpc.questions.update.useMutation();
  const deleteMutation = trpc.questions.delete.useMutation();

  const [questions, setQuestions] = useState<Question[]>(loadQuestionsFromStorage);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (listQuery.data && isAuthenticated) {
      const mapped = listQuery.data.map(mapDbQuestion);
      setQuestions(mapped);
      saveQuestionsToStorage(mapped);
    }
  }, [listQuery.data, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      saveQuestionsToStorage(questions);
    }
  }, [questions, isAuthenticated]);

  const handleTypeChange = (type: QuestionType) => {
    setFormData({
      ...getEmptyForm(type),
      title: formData.title,
      difficulty: formData.difficulty,
      category: formData.category,
      points: formData.points,
      explanation: formData.explanation,
    });
  };

  const handleAddOption = () => {
    const usedKeys = new Set(formData.options.map((o) => o.key));
    const nextKey = OPTION_KEYS.split("").find((k) => !usedKeys.has(k));
    if (!nextKey) {
      alert("选项数量已达上限");
      return;
    }
    setFormData({
      ...formData,
      options: [...formData.options, { key: nextKey, text: "" }],
    });
  };

  const handleRemoveOption = (key: string) => {
    const minCount = formData.type === "trueFalse" ? 2 : 2;
    if (formData.options.length <= minCount) {
      alert(`至少保留 ${minCount} 个选项`);
      return;
    }
    const newOptions = formData.options.filter((o) => o.key !== key);
    let newCorrect = formData.correctAnswer;
    if (formData.type === "multiple") {
      newCorrect = formData.correctAnswer
        .split(",")
        .filter((k) => k && k !== key)
        .join(",");
    } else if (formData.correctAnswer === key) {
      newCorrect = "";
    }
    setFormData({ ...formData, options: newOptions, correctAnswer: newCorrect });
  };

  const handleOptionTextChange = (key: string, text: string) => {
    setFormData({
      ...formData,
      options: formData.options.map((o) => (o.key === key ? { ...o, text } : o)),
    });
  };

  const handleSingleCorrect = (key: string) => {
    setFormData({ ...formData, correctAnswer: key });
  };

  const handleMultipleCorrect = (key: string, checked: boolean) => {
    const selected = formData.correctAnswer
      ? formData.correctAnswer.split(",").filter(Boolean)
      : [];
    const next = checked
      ? selected.includes(key)
        ? selected
        : [...selected, key]
      : selected.filter((k) => k !== key);
    setFormData({ ...formData, correctAnswer: next.sort().join(",") });
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      alert("请输入题目内容");
      return false;
    }

    if (formData.type === "fillBlank") {
      if (!formData.fillBlankAnswer.trim()) {
        alert("请输入填空题参考答案");
        return false;
      }
      return true;
    }

    const emptyOption = formData.options.find((o) => !o.text.trim());
    if (emptyOption) {
      alert(`请填写选项 ${emptyOption.key} 的内容`);
      return false;
    }

    if (!formData.correctAnswer) {
      alert(
        formData.type === "multiple" ? "请至少选择一个正确答案" : "请选择正确答案"
      );
      return false;
    }

    return true;
  };

  const buildQuestionPayload = (): Omit<Question, "id"> => {
    if (formData.type === "fillBlank") {
      return {
        type: formData.type,
        title: formData.title.trim(),
        difficulty: formData.difficulty,
        category: formData.category || undefined,
        points: formData.points,
        correctAnswer: formData.fillBlankAnswer.trim(),
        explanation: formData.explanation || undefined,
      };
    }

    return {
      type: formData.type,
      title: formData.title.trim(),
      difficulty: formData.difficulty,
      category: formData.category || undefined,
      points: formData.points,
      options: optionsListToRecord(formData.options),
      correctAnswer: formData.correctAnswer,
      explanation: formData.explanation || undefined,
    };
  };

  const handleAddQuestion = async () => {
    if (!validateForm()) return;

    const payload = buildQuestionPayload();
    const apiInput = toApiInput(payload);

    setSaving(true);
    try {
      if (isAuthenticated) {
        if (editingId) {
          await updateMutation.mutateAsync({
            id: editingId,
            title: apiInput.title,
            options: apiInput.options,
            correctAnswer: apiInput.correctAnswer,
            explanation: apiInput.explanation,
            difficulty: apiInput.difficulty,
            category: apiInput.category,
            points: apiInput.points,
          });
          toast.success("题目已更新");
        } else {
          await createMutation.mutateAsync(apiInput);
          toast.success("题目已保存到题库");
        }
        await utils.questions.list.invalidate();
      } else {
        if (editingId) {
          const next = questions.map((q) =>
            q.id === editingId ? { ...q, ...payload } : q
          );
          setQuestions(next);
          saveQuestionsToStorage(next);
        } else {
          const next = [...questions, { id: Date.now(), ...payload }];
          setQuestions(next);
          saveQuestionsToStorage(next);
        }
        toast.success("题目已保存（本地缓存，刷新浏览器后仍可见）");
      }

      setEditingId(null);
      setFormData(getEmptyForm());
      setShowForm(false);
    } catch (error) {
      console.error(error);
      toast.error("保存失败，请稍后重试");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (question: Question) => {
    setEditingId(question.id);
    const list = optionsRecordToList(question.options);
    setFormData({
      type: question.type,
      title: question.title,
      difficulty: question.difficulty,
      category: question.category || "",
      points: question.points,
      options:
        list.length > 0 ? list : getDefaultOptions(question.type),
      correctAnswer:
        question.type === "fillBlank" ? "" : question.correctAnswer,
      fillBlankAnswer:
        question.type === "fillBlank" ? question.correctAnswer : "",
      explanation: question.explanation || "",
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这道题目吗？")) return;

    try {
      const isLocalOnlyId = id > 1_000_000_000;
      if (isAuthenticated && !isLocalOnlyId) {
        await deleteMutation.mutateAsync({ id });
        await utils.questions.list.invalidate();
        toast.success("题目已删除");
      } else {
        const next = questions.filter((q) => q.id !== id);
        setQuestions(next);
        saveQuestionsToStorage(next);
        toast.success("题目已删除");
      }
    } catch (error) {
      console.error(error);
      toast.error("删除失败，请稍后重试");
    }
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData(getEmptyForm());
    setShowForm(true);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-pink-500";
      case "medium":
        return "text-pink-600";
      case "hard":
        return "text-pink-800";
      default:
        return "text-muted-foreground";
    }
  };

  const showOptionsEditor = needsOptions(formData.type as QuestionType);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            返回
          </button>
          <h1 className="text-lg font-bold gradient-text">题库管理</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container py-8">
        <div className="flex justify-end mb-6">
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
              } else {
                openNewForm();
              }
            }}
            className="btn-elegant-primary"
          >
            {showForm ? "取消" : "新增题目"}
          </Button>
        </div>

        {showForm && (
          <div className="card-elegant mb-8 max-w-2xl">
            <h2 className="text-xl font-bold mb-6">
              {editingId ? "编辑题目" : "新增题目"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">题目类型</label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    handleTypeChange(e.target.value as QuestionType)
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="single">单选题</option>
                  <option value="multiple">多选题</option>
                  <option value="trueFalse">判断题</option>
                  <option value="fillBlank">填空题</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">题目内容</label>
                <textarea
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="输入题目内容..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                />
              </div>

              {showOptionsEditor && (
                <div className="space-y-3 p-4 rounded-lg border border-border/50 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">选项设置</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddOption}
                    >
                      增加选项
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formData.type === "multiple"
                      ? "勾选多个正确答案；可点击「增加选项」添加 E、F 等选项"
                      : formData.type === "trueFalse"
                        ? "默认「正确 / 错误」，也可增加更多选项"
                        : "请填写各选项内容并选择一个正确答案"}
                  </p>

                  <div className="space-y-2">
                    {formData.options.map((option) => (
                      <div
                        key={option.key}
                        className="flex flex-wrap items-center gap-2 sm:flex-nowrap"
                      >
                        <span className="w-8 shrink-0 text-sm font-semibold text-primary">
                          {option.key}.
                        </span>
                        <input
                          type="text"
                          value={option.text}
                          onChange={(e) =>
                            handleOptionTextChange(option.key, e.target.value)
                          }
                          placeholder={`选项 ${option.key}`}
                          className="flex-1 min-w-[120px] px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        {formData.type === "single" ||
                        formData.type === "trueFalse" ? (
                          <label className="flex items-center gap-1.5 shrink-0 text-sm cursor-pointer">
                            <input
                              type="radio"
                              name="correctAnswer"
                              checked={formData.correctAnswer === option.key}
                              onChange={() => handleSingleCorrect(option.key)}
                              className="accent-primary"
                            />
                            答案
                          </label>
                        ) : (
                          <label className="flex items-center gap-1.5 shrink-0 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.correctAnswer
                                .split(",")
                                .includes(option.key)}
                              onChange={(e) =>
                                handleMultipleCorrect(
                                  option.key,
                                  e.target.checked
                                )
                              }
                              className="accent-primary"
                            />
                            答案
                          </label>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.key)}
                          className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded transition-colors shrink-0"
                        >
                          删除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.type === "fillBlank" && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    参考答案
                  </label>
                  <input
                    type="text"
                    value={formData.fillBlankAnswer}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fillBlankAnswer: e.target.value,
                      })
                    }
                    placeholder="多个空用 | 分隔，如：答案1|答案2"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">
                  答案解析（选填）
                </label>
                <textarea
                  value={formData.explanation}
                  onChange={(e) =>
                    setFormData({ ...formData, explanation: e.target.value })
                  }
                  placeholder="选填，学生作答后可查看..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">难度</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        difficulty: e.target.value as "easy" | "medium" | "hard",
                      })
                    }
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">分值</label>
                  <input
                    type="number"
                    value={formData.points}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        points: parseFloat(e.target.value) || 1,
                      })
                    }
                    min="0.5"
                    step="0.5"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">分类</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="如：第一章 基础概念"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  取消
                </Button>
                <Button
                  onClick={handleAddQuestion}
                  disabled={saving}
                  className="btn-elegant-primary"
                >
                  {saving
                    ? "保存中..."
                    : editingId
                      ? "保存修改"
                      : "添加题目"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {listQuery.isLoading && isAuthenticated ? (
            <div className="card-elegant text-center py-12 text-muted-foreground">
              正在加载题库...
            </div>
          ) : questions.length === 0 ? (
            <div className="card-elegant text-center py-12">
              <p className="text-muted-foreground mb-4">暂无题目</p>
              <Button onClick={openNewForm} className="btn-elegant-primary">
                创建第一道题目
              </Button>
            </div>
          ) : (
            questions.map((question, index) => (
              <div
                key={question.id}
                className="card-elegant hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-sm font-semibold text-primary">
                        {index + 1}
                      </span>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {getTypeLabel(question.type)}
                      </span>
                      <span
                        className={`text-xs font-medium ${getDifficultyColor(
                          question.difficulty
                        )}`}
                      >
                        {question.difficulty === "easy"
                          ? "简单"
                          : question.difficulty === "medium"
                          ? "中等"
                          : "困难"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {question.points} 分
                      </span>
                    </div>
                    <p className="text-foreground font-medium mb-2">
                      {question.title}
                    </p>
                    {question.options &&
                      Object.keys(question.options).length > 0 && (
                        <ul className="text-sm text-muted-foreground space-y-1 mb-2">
                          {Object.entries(question.options)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([key, text]) => (
                              <li key={key}>
                                <span
                                  className={
                                    question.correctAnswer
                                      .split(",")
                                      .includes(key)
                                      ? "text-primary font-medium"
                                      : ""
                                  }
                                >
                                  {key}. {text}
                                  {question.correctAnswer
                                    .split(",")
                                    .includes(key)
                                    ? "（正确）"
                                    : ""}
                                </span>
                              </li>
                            ))}
                        </ul>
                      )}
                    {question.type === "fillBlank" && (
                      <p className="text-sm text-muted-foreground mb-2">
                        参考答案: {question.correctAnswer}
                      </p>
                    )}
                    {question.category && (
                      <p className="text-sm text-muted-foreground">
                        分类: {question.category}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => handleEdit(question)}
                      className="px-3 py-1 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(question.id)}
                      className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {questions.length > 0 && (
          <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/20">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">
                  {questions.length}
                </p>
                <p className="text-sm text-muted-foreground">总题数</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {questions.filter((q) => q.difficulty === "easy").length}
                </p>
                <p className="text-sm text-muted-foreground">简单题</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {questions.filter((q) => q.difficulty === "medium").length}
                </p>
                <p className="text-sm text-muted-foreground">中等题</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">
                  {questions.reduce((sum, q) => sum + q.points, 0)}
                </p>
                <p className="text-sm text-muted-foreground">总分</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
