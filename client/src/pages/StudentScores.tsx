import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface StudentScore {
  id: number;
  examTitle: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  duration: number;
  status: "passed" | "failed";
}

export default function StudentScores() {
  const [, navigate] = useLocation();
  const [selectedScore, setSelectedScore] = useState<StudentScore | null>(null);

  // Mock data
  const scores: StudentScore[] = [
    {
      id: 1,
      examTitle: "数学期中考试",
      score: 85,
      totalPoints: 100,
      submittedAt: "2026-03-30 10:30",
      duration: 120,
      status: "passed",
    },
    {
      id: 2,
      examTitle: "英语期末考试",
      score: 78,
      totalPoints: 100,
      submittedAt: "2026-03-29 14:45",
      duration: 90,
      status: "passed",
    },
    {
      id: 3,
      examTitle: "物理单元测试",
      score: 92,
      totalPoints: 100,
      submittedAt: "2026-03-28 09:20",
      duration: 60,
      status: "passed",
    },
  ];

  const statistics = {
    totalExams: scores.length,
    averageScore:
      scores.length > 0
        ? Math.round(
            (scores.reduce((sum, s) => sum + s.score, 0) / scores.length) * 100
          ) / 100
        : 0,
    passedCount: scores.filter((s) => s.status === "passed").length,
    passRate:
      scores.length > 0
        ? Math.round(
            ((scores.filter((s) => s.status === "passed").length /
              scores.length) *
              100 *
              100) /
              100
          )
        : 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/student/dashboard")}
            >
              返回
            </Button>
            <h1 className="text-lg font-bold gradient-text">我的成绩</h1>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">考试总数</p>
            <p className="text-3xl font-bold">{statistics.totalExams}</p>
          </div>
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">平均分</p>
            <p className="text-3xl font-bold">{statistics.averageScore}</p>
          </div>
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">及格数</p>
            <p className="text-3xl font-bold">{statistics.passedCount}</p>
          </div>
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">及格率</p>
            <p className="text-3xl font-bold">{statistics.passRate}%</p>
          </div>
        </div>

        {/* Scores List */}
        <div className="space-y-4">
          {scores.length > 0 ? (
            scores.map((score) => (
              <div
                key={score.id}
                className="card-elegant hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedScore(score)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-2">{score.examTitle}</h3>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <span>提交时间: {score.submittedAt}</span>
                      <span>用时: {score.duration} 分钟</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold mb-2 ${
                        score.status === "passed"
                          ? "text-pink-600"
                          : "text-pink-800"
                      }`}
                    >
                      {score.score}
                    </div>
                    <div className="text-sm text-muted-foreground mb-3">
                      / {score.totalPoints}
                    </div>
                    <Button variant="outline" size="sm">
                      查看详情
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="card-elegant text-center py-12">
              <p className="text-muted-foreground mb-4">暂无考试成绩</p>
              <Button
                onClick={() => navigate("/student/dashboard")}
                className="btn-elegant-primary"
              >
                返回学生中心
              </Button>
            </div>
          )}
        </div>

        {/* Score Detail Modal */}
        {selectedScore && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="card-elegant max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedScore.examTitle}</h2>
                <button
                  onClick={() => setSelectedScore(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">成绩</span>
                  <span className="font-bold text-lg">{selectedScore.score}/{selectedScore.totalPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">状态</span>
                  <span
                    className={`font-bold ${
                      selectedScore.status === "passed"
                        ? "text-pink-600"
                        : "text-pink-800"
                    }`}
                  >
                    {selectedScore.status === "passed" ? "及格" : "未及格"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">用时</span>
                  <span className="font-bold">{selectedScore.duration} 分钟</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">提交时间</span>
                  <span className="font-bold">{selectedScore.submittedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  className="w-full btn-elegant-primary"
                  onClick={() => setSelectedScore(null)}
                >
                  关闭
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
