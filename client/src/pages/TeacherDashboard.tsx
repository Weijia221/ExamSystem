import { useAuth } from "@/_core/hooks/useAuth";
import { useTeacherQuestions } from "@/hooks/useTeacherQuestions";
import { getDifficultyLabel, getTypeLabel } from "@/lib/questions";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [location, navigate] = useLocation();
  const { questions, isLoading, syncFromStorage } = useTeacherQuestions();
  const [activeTab, setActiveTab] = useState<"questions" | "exams" | "scores">("questions");

  useEffect(() => {
    syncFromStorage();
  }, [location, syncFromStorage]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const menuItems = [
    {
      id: "questions",
      label: "题库管理",
      description: "创建、编辑和管理题目",
    },
    {
      id: "exams",
      label: "试卷发布",
      description: "组卷和发布考试",
    },
    {
      id: "scores",
      label: "查看分数",
      description: "查看学生成绩",
    },
  ];

  const easyCount = questions.filter((q) => q.difficulty === "easy").length;
  const mediumCount = questions.filter((q) => q.difficulty === "medium").length;
  const hardCount = questions.filter((q) => q.difficulty === "hard").length;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <div>
            <h1 className="text-lg font-bold gradient-text">ExamHub</h1>
            <p className="text-xs text-muted-foreground">教师管理系统</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">
                {user?.name || user?.email}
              </p>
              <p className="text-xs text-muted-foreground">教师</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              退出
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <nav className="space-y-2 sticky top-24">
              {menuItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      setActiveTab(item.id as "questions" | "exams" | "scores")
                    }
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-foreground hover:bg-card border border-border/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    <p
                      className={`text-xs ${
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground"
                      }`}
                    >
                      {item.description}
                      {item.id === "questions" && questions.length > 0
                        ? ` · ${questions.length} 题`
                        : ""}
                    </p>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="lg:col-span-3">
            {activeTab === "questions" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">题库管理</h2>
                    <p className="text-muted-foreground mt-1">
                      创建和管理您的题目库
                      {questions.length > 0 && (
                        <span className="text-primary font-medium">
                          {" "}
                          · 共 {questions.length} 道题
                        </span>
                      )}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleNavigate("/question-bank")}
                    className="btn-elegant-primary"
                  >
                    管理题库
                  </Button>
                </div>

                {isLoading ? (
                  <div className="card-elegant text-center py-12 text-muted-foreground">
                    正在加载题目...
                  </div>
                ) : questions.length === 0 ? (
                  <div className="card-elegant text-center py-12">
                    <h3 className="text-lg font-semibold mb-2">暂无题目</h3>
                    <p className="text-muted-foreground mb-6">
                      开始创建您的第一道题目吧
                    </p>
                    <Button
                      onClick={() => handleNavigate("/question-bank")}
                      className="btn-elegant-primary"
                    >
                      创建题目
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="card-elegant text-center py-4">
                        <p className="text-2xl font-bold text-primary">
                          {questions.length}
                        </p>
                        <p className="text-sm text-muted-foreground">总题数</p>
                      </div>
                      <div className="card-elegant text-center py-4">
                        <p className="text-2xl font-bold text-primary">
                          {easyCount}
                        </p>
                        <p className="text-sm text-muted-foreground">简单</p>
                      </div>
                      <div className="card-elegant text-center py-4">
                        <p className="text-2xl font-bold text-primary">
                          {mediumCount}
                        </p>
                        <p className="text-sm text-muted-foreground">中等</p>
                      </div>
                      <div className="card-elegant text-center py-4">
                        <p className="text-2xl font-bold text-primary">
                          {hardCount}
                        </p>
                        <p className="text-sm text-muted-foreground">困难</p>
                      </div>
                    </div>

                    <div className="card-elegant">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">最近题目</h3>
                        <p className="text-sm text-muted-foreground">
                          总分 {totalPoints} 分
                        </p>
                      </div>
                      <div className="space-y-3">
                        {questions.slice(0, 8).map((question, index) => (
                          <div
                            key={question.id}
                            className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border/50 bg-background/50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-primary">
                                  {index + 1}
                                </span>
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {getTypeLabel(question.type)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getDifficultyLabel(question.difficulty)} ·{" "}
                                  {question.points} 分
                                </span>
                              </div>
                              <p className="text-sm font-medium truncate">
                                {question.title}
                              </p>
                              {question.category && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {question.category}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {questions.length > 8 && (
                        <p className="text-sm text-muted-foreground text-center mt-4">
                          还有 {questions.length - 8} 道题，请点击「管理题库」查看全部
                        </p>
                      )}
                      <div className="mt-6 flex justify-center">
                        <Button
                          onClick={() => handleNavigate("/question-bank")}
                          className="btn-elegant-primary"
                        >
                          查看全部题目
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === "exams" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">试卷发布</h2>
                    <p className="text-muted-foreground mt-1">组卷并发布考试</p>
                  </div>
                  <Button
                    onClick={() => handleNavigate("/exam-creation")}
                    className="btn-elegant-primary"
                  >
                    新增试卷
                  </Button>
                </div>

                <div className="card-elegant text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">暂无试卷</h3>
                  <p className="text-muted-foreground mb-6">
                    创建试卷后，学生可以参加考试
                  </p>
                  <Button
                    onClick={() => handleNavigate("/exam-creation")}
                    className="btn-elegant-primary"
                  >
                    创建试卷
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "scores" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">查看分数</h2>
                    <p className="text-muted-foreground mt-1">
                      查看学生的考试成绩
                    </p>
                  </div>
                  <Button
                    onClick={() => handleNavigate("/teacher/scores")}
                    className="btn-elegant-primary"
                  >
                    查看详情
                  </Button>
                </div>

                <div className="card-elegant text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">暂无成绩数据</h3>
                  <p className="text-muted-foreground mb-6">
                    学生完成考试后，成绩将显示在这里
                  </p>
                  <Button
                    onClick={() => handleNavigate("/teacher/scores")}
                    className="btn-elegant-primary"
                  >
                    查看成绩管理
                  </Button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
