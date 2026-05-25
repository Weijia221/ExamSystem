import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";

export default function RoleSelect() {
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectRole = async (role: "teacher" | "student") => {
    setSelectedRole(role);
    setIsLoading(true);
    setTimeout(() => {
      if (role === "teacher") {
        navigate("/teacher/dashboard");
      } else {
        navigate("/student/dashboard");
      }
    }, 500);
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <div className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={handleBack}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            返回
          </button>
          <span className="text-lg font-bold gradient-text">ExamHub</span>
          <div className="w-16"></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div className="max-w-4xl w-full space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold">选择您的身份</h1>
            <p className="text-lg text-muted-foreground">
              请选择您的角色开始使用系统
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <button
              onClick={() => handleSelectRole("teacher")}
              disabled={isLoading}
              className={`card-elegant text-left group relative overflow-hidden transition-all duration-300 ${
                selectedRole === "teacher" ? "ring-2 ring-primary shadow-lg" : ""
              } ${isLoading && selectedRole !== "teacher" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">教师</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    创建和管理题库，发布考试试卷，查看学生成绩和答题分析
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>题库管理</li>
                  <li>试卷发布</li>
                  <li>成绩查看</li>
                </ul>

                <Button
                  className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={isLoading}
                >
                  {isLoading && selectedRole === "teacher" ? "加载中..." : "选择教师"}
                </Button>
              </div>
            </button>

            <button
              onClick={() => handleSelectRole("student")}
              disabled={isLoading}
              className={`card-elegant text-left group relative overflow-hidden transition-all duration-300 ${
                selectedRole === "student" ? "ring-2 ring-secondary shadow-lg" : ""
              } ${isLoading && selectedRole !== "student" ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div className="relative space-y-6">
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-foreground">学生</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    练习题库中的题目，参加教师发布的考试，查看成绩和答题详情
                  </p>
                </div>

                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>自由练习</li>
                  <li>参加考试</li>
                  <li>成绩查询</li>
                </ul>

                <Button
                  className="w-full mt-4 bg-secondary text-secondary-foreground hover:bg-secondary/90"
                  disabled={isLoading}
                >
                  {isLoading && selectedRole === "student" ? "加载中..." : "选择学生"}
                </Button>
              </div>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
