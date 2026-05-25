import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"practice" | "exams" | "scores">("practice");

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const menuItems = [
    {
      id: "practice",
      label: "自由练习",
      description: "练习题库中的题目",
    },
    {
      id: "exams",
      label: "参加考试",
      description: "参加教师发布的考试",
    },
    {
      id: "scores",
      label: "查看分数",
      description: "查看历史成绩",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <div>
            <h1 className="text-lg font-bold gradient-text">ExamHub</h1>
            <p className="text-xs text-muted-foreground">学生考试系统</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.name || user?.email}</p>
              <p className="text-xs text-muted-foreground">学生</p>
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
                    onClick={() => setActiveTab(item.id as "practice" | "exams" | "scores")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-secondary text-secondary-foreground shadow-md"
                        : "text-foreground hover:bg-card border border-border/50"
                    }`}
                  >
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className={`text-xs ${isActive ? "text-secondary-foreground/70" : "text-muted-foreground"}`}>
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="lg:col-span-3">
            {activeTab === "practice" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold">自由练习</h2>
                  <p className="text-muted-foreground mt-1">从题库中随机抽取题目进行练习</p>
                </div>

                <div className="card-elegant text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">暂无可用题目</h3>
                  <p className="text-muted-foreground mb-6">教师还未创建题目，请稍后再试</p>
                  <Button onClick={() => handleNavigate("/student/exam")} className="btn-elegant-secondary">
                    开始练习
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "exams" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold">参加考试</h2>
                  <p className="text-muted-foreground mt-1">查看并参加教师发布的考试</p>
                </div>

                <div className="card-elegant text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">暂无可用考试</h3>
                  <p className="text-muted-foreground mb-6">教师还未发布考试，请稍后再试</p>
                  <Button onClick={() => handleNavigate("/student/exam")} className="btn-elegant-secondary">
                    参加考试
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "scores" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold">查看分数</h2>
                    <p className="text-muted-foreground mt-1">查看您的历史考试成绩</p>
                  </div>
                  <Button onClick={() => handleNavigate("/student/scores")} className="btn-elegant-primary">
                    查看详情
                  </Button>
                </div>

                <div className="card-elegant text-center py-12">
                  <h3 className="text-lg font-semibold mb-2">暂无成绩数据</h3>
                  <p className="text-muted-foreground mb-6">完成考试后，成绩将显示在这里</p>
                  <Button onClick={() => handleNavigate("/student/scores")} className="btn-elegant-primary">
                    查看我的成绩
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
