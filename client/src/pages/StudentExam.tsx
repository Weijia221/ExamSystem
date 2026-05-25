import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface Question {
  id: number;
  title: string;
  type: "single" | "multiple" | "trueFalse" | "fillBlank";
  options?: Record<string, string>;
  points: number;
}

export default function StudentExam() {
  const [, navigate] = useLocation();
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      title: "什么是在线考试系统？",
      type: "single",
      options: {
        A: "一个用于组织线上考试的平台",
        B: "一个社交媒体应用",
        C: "一个文件存储服务",
        D: "一个视频播放器",
      },
      points: 5,
    },
    {
      id: 2,
      title: "以下哪些是在线考试系统的功能？（多选）",
      type: "multiple",
      options: {
        A: "题库管理",
        B: "试卷发布",
        C: "成绩查看",
        D: "视频编辑",
      },
      points: 10,
    },
    {
      id: 3,
      title: "在线考试系统可以帮助教师节省时间。",
      type: "trueFalse",
      points: 5,
    },
  ];

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (value: string) => {
    setAnswers({
      ...answers,
      [currentQuestion]: value,
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleFinish = () => {
    navigate("/student/dashboard");
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q, idx) => {
      if (answers[idx]) {
        score += q.points;
      }
    });
    return Math.round((score / questions.reduce((sum, q) => sum + q.points, 0)) * 100);
  };

  if (submitted) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="card-elegant max-w-md w-full text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-bold text-primary">{score}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">考试完成</h1>
            <p className="text-muted-foreground">
              您的成绩已提交，感谢您的参与！
            </p>
          </div>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">总题数</span>
              <span className="font-medium">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">答题数</span>
              <span className="font-medium">
                {Object.keys(answers).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">得分</span>
              <span className="font-medium text-primary text-lg">{score}</span>
            </div>
          </div>

          <Button
            onClick={handleFinish}
            className="w-full btn-elegant-primary"
          >
            返回学生中心
          </Button>
        </div>
      </div>
    );
  }

  const question = questions[currentQuestion];
  const isTimeWarning = timeLeft < 300; // 5 minutes

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold gradient-text">在线考试</h1>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              isTimeWarning
                ? "bg-pink-200 text-pink-800"
                : "bg-primary/10 text-primary"
            }`}
          >
            <span className="font-semibold">剩余 {formatTime(timeLeft)}</span>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="card-elegant">
              {/* Question */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    第 {currentQuestion + 1} 题 / 共 {questions.length} 题
                  </h2>
                  <span className="text-sm bg-primary/10 text-primary px-3 py-1 rounded">
                    {question.points} 分
                  </span>
                </div>

                <p className="text-lg mb-6 leading-relaxed">
                  {question.title}
                </p>

                {/* Options */}
                {question.type === "single" && (
                  <div className="space-y-3">
                    {Object.entries(question.options || {}).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          value={key}
                          checked={answers[currentQuestion] === key}
                          onChange={(e) => handleAnswer(e.target.value)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="ml-3 font-medium">{key}.</span>
                        <span className="ml-2">{value}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "multiple" && (
                  <div className="space-y-3">
                    {Object.entries(question.options || {}).map(([key, value]) => (
                      <label
                        key={key}
                        className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <input
                          type="checkbox"
                          value={key}
                          checked={
                            answers[currentQuestion]?.includes(key) || false
                          }
                          onChange={(e) => {
                            const current = answers[currentQuestion] || "";
                            if (e.target.checked) {
                              handleAnswer(current + key);
                            } else {
                              handleAnswer(
                                current.replace(key, "")
                              );
                            }
                          }}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="ml-3 font-medium">{key}.</span>
                        <span className="ml-2">{value}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "trueFalse" && (
                  <div className="space-y-3">
                    {["正确", "错误"].map((value, idx) => (
                      <label
                        key={idx}
                        className="flex items-center p-4 border-2 border-border rounded-lg cursor-pointer hover:bg-primary/5 transition-colors"
                      >
                        <input
                          type="radio"
                          name={`question-${currentQuestion}`}
                          value={value}
                          checked={answers[currentQuestion] === value}
                          onChange={(e) => handleAnswer(e.target.value)}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="ml-3">{value}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === "fillBlank" && (
                  <input
                    type="text"
                    value={answers[currentQuestion] || ""}
                    onChange={(e) => handleAnswer(e.target.value)}
                    placeholder="请输入答案..."
                    className="w-full px-4 py-3 border-2 border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 justify-between pt-6 border-t border-border/50">
                <Button
                  onClick={() =>
                    setCurrentQuestion(Math.max(0, currentQuestion - 1))
                  }
                  disabled={currentQuestion === 0}
                  variant="outline"
                >
                  上一题
                </Button>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setCurrentQuestion(
                        Math.min(questions.length - 1, currentQuestion + 1)
                      )
                    }
                    disabled={currentQuestion === questions.length - 1}
                    variant="outline"
                  >
                    下一题
                  </Button>

                  {currentQuestion === questions.length - 1 && (
                    <Button
                      onClick={handleSubmit}
                      className="btn-elegant-primary"
                    >
                      提交答卷
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-elegant sticky top-24">
              <h3 className="font-bold mb-4">答题进度</h3>

              {isTimeWarning && (
                <div className="mb-4 p-3 bg-pink-100 border border-pink-300 rounded-lg">
                  <p className="text-sm text-pink-800">
                    时间即将结束，请尽快提交答卷
                  </p>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestion(idx)}
                    className={`aspect-square rounded-lg font-medium transition-colors ${
                      idx === currentQuestion
                        ? "bg-primary text-primary-foreground"
                        : answers[idx]
                        ? "bg-pink-100 text-pink-700"
                        : "bg-background border border-border/50 text-muted-foreground hover:border-primary"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-pink-100 border border-pink-300"></div>
                  <span>已答题</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-background border border-border/50"></div>
                  <span>未答题</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
