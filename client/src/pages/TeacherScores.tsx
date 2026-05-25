import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface ExamScore {
  id: number;
  studentName: string;
  examTitle: string;
  score: number;
  totalPoints: number;
  submittedAt: string;
  status: "completed" | "pending";
}

export default function TeacherScores() {
  const [, navigate] = useLocation();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Mock data
  const examScores: ExamScore[] = [
    {
      id: 1,
      studentName: "张三",
      examTitle: "数学期中考试",
      score: 85,
      totalPoints: 100,
      submittedAt: "2026-03-30 10:30",
      status: "completed",
    },
    {
      id: 2,
      studentName: "李四",
      examTitle: "数学期中考试",
      score: 92,
      totalPoints: 100,
      submittedAt: "2026-03-30 10:45",
      status: "completed",
    },
    {
      id: 3,
      studentName: "王五",
      examTitle: "英语期末考试",
      score: 78,
      totalPoints: 100,
      submittedAt: "2026-03-30 11:00",
      status: "completed",
    },
    {
      id: 4,
      studentName: "赵六",
      examTitle: "英语期末考试",
      score: 88,
      totalPoints: 100,
      submittedAt: "2026-03-30 11:15",
      status: "completed",
    },
  ];

  const exams = Array.from(new Set(examScores.map((s) => s.examTitle)));
  const students = Array.from(new Set(examScores.map((s) => s.studentName)));

  const filteredScores = examScores.filter((score) => {
    if (selectedExam && score.examTitle !== selectedExam) return false;
    if (selectedStudent && score.studentName !== selectedStudent) return false;
    return true;
  });

  const statistics = {
    totalExams: exams.length,
    totalStudents: students.length,
    averageScore:
      filteredScores.length > 0
        ? Math.round(
            (filteredScores.reduce((sum, s) => sum + s.score, 0) /
              filteredScores.length) *
              100
          ) / 100
        : 0,
    passRate:
      filteredScores.length > 0
        ? Math.round(
            ((filteredScores.filter((s) => s.score >= 60).length /
              filteredScores.length) *
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
              onClick={() => navigate("/teacher/dashboard")}
            >
              返回
            </Button>
            <h1 className="text-lg font-bold gradient-text">查看分数</h1>
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
            <p className="text-sm text-muted-foreground mb-1">学生总数</p>
            <p className="text-3xl font-bold">{statistics.totalStudents}</p>
          </div>
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">平均分</p>
            <p className="text-3xl font-bold">{statistics.averageScore}</p>
          </div>
          <div className="card-elegant">
            <p className="text-sm text-muted-foreground mb-1">及格率</p>
            <p className="text-3xl font-bold">{statistics.passRate}%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card-elegant mb-8">
          <h3 className="font-bold mb-4">筛选条件</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                选择考试
              </label>
              <select
                value={selectedExam || ""}
                onChange={(e) => setSelectedExam(e.target.value || null)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">全部考试</option>
                {exams.map((exam) => (
                  <option key={exam} value={exam}>
                    {exam}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">
                选择学生
              </label>
              <select
                value={selectedStudent || ""}
                onChange={(e) => setSelectedStudent(e.target.value || null)}
                className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">全部学生</option>
                {students.map((student) => (
                  <option key={student} value={student}>
                    {student}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scores Table */}
        <div className="card-elegant overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border/50 bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    学生名字
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    考试名称
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    成绩
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    提交时间
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredScores.length > 0 ? (
                  filteredScores.map((score) => (
                    <tr
                      key={score.id}
                      className="border-b border-border/50 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm">{score.studentName}</td>
                      <td className="px-6 py-4 text-sm">{score.examTitle}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-bold ${
                            score.score >= 80
                              ? "text-pink-500"
                              : score.score >= 60
                              ? "text-pink-600"
                              : "text-pink-800"
                          }`}
                        >
                          {score.score}/{score.totalPoints}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {score.submittedAt}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center">
                      <p className="text-muted-foreground">暂无成绩数据</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-6 flex justify-end">
          <Button className="btn-elegant-primary">导出成绩</Button>
        </div>
      </div>
    </div>
  );
}
