import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  loadQuestionsFromStorage,
  getTypeLabel,
  type TeacherQuestion,
} from "@/lib/questions";
import { useTeacherQuestions } from "@/hooks/useTeacherQuestions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SelectedQuestion {
  id: number;
  title: string;
  type: string;
  points: number;
}

export default function ExamCreation() {
  const [, navigate] = useLocation();
  const { questions, isLoading } = useTeacherQuestions();
  
  const [examData, setExamData] = useState({
    title: "",
    description: "",
    duration: 60,
    totalPoints: 100,
    passingScore: 60,
  });
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [selectedInBank, setSelectedInBank] = useState<number[]>([]);

  const handleOpenQuestionBank = () => {
    // 获取已选题目ID，避免重复选择
    const existingIds = selectedQuestions.map(q => q.id);
    setSelectedInBank(existingIds);
    setShowQuestionBank(true);
  };

  const handleSelectFromBank = () => {
    // 找出新选择的题目
    const newSelections = selectedInBank.filter(
      id => !selectedQuestions.some(q => q.id === id)
    );
    
    // 将新题目添加到试卷
    const newQuestions = newSelections.map(id => {
      const question = questions.find(q => q.id === id);
      return question ? {
        id: question.id,
        title: question.title,
        type: question.type,
        points: question.points,
      } : null;
    }).filter(Boolean) as SelectedQuestion[];
    
    setSelectedQuestions([...selectedQuestions, ...newQuestions]);
    setShowQuestionBank(false);
  };

  const handleAddQuestion = () => {
    const newQuestion: SelectedQuestion = {
      id: Date.now(),
      title: `示例题目 ${selectedQuestions.length + 1}`,
      type: "single",
      points: 5,
    };
    setSelectedQuestions([...selectedQuestions, newQuestion]);
  };

  const handleRemoveQuestion = (id: number) => {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== id));
  };

  const handlePublish = () => {
    if (!examData.title.trim()) {
      alert("请输入试卷标题");
      return;
    }
    if (selectedQuestions.length === 0) {
      alert("请至少添加一道题目");
      return;
    }
    alert("试卷已发布！");
    navigate("/teacher/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-card/50">
        <div className="container flex items-center justify-between h-16">
          <button
            onClick={() => navigate("/teacher/dashboard")}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            返回
          </button>
          <h1 className="text-lg font-bold gradient-text">创建试卷</h1>
          <div className="w-16"></div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <div className="card-elegant space-y-6">
              <h2 className="text-2xl font-bold">试卷信息</h2>

              <div>
                <label className="block text-sm font-medium mb-2">试卷标题</label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) =>
                    setExamData({ ...examData, title: e.target.value })
                  }
                  placeholder="如：第一章测试卷"
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">试卷描述</label>
                <textarea
                  value={examData.description}
                  onChange={(e) =>
                    setExamData({ ...examData, description: e.target.value })
                  }
                  placeholder="输入试卷描述..."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">时长（分钟）</label>
                  <input
                    type="number"
                    value={examData.duration}
                    onChange={(e) =>
                      setExamData({
                        ...examData,
                        duration: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">总分</label>
                  <input
                    type="number"
                    value={examData.totalPoints}
                    onChange={(e) =>
                      setExamData({
                        ...examData,
                        totalPoints: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">及格分数</label>
                <input
                  type="number"
                  value={examData.passingScore}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      passingScore: parseInt(e.target.value),
                    })
                  }
                  min="0"
                  max={examData.totalPoints}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div>
            <div className="card-elegant sticky top-24 space-y-6">
              <h2 className="text-lg font-bold">试卷预览</h2>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">试卷标题</span>
                  <span className="font-medium">
                    {examData.title || "未设置"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">时长</span>
                  <span className="font-medium">{examData.duration} 分钟</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">总分</span>
                  <span className="font-medium">{examData.totalPoints} 分</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">及格分</span>
                  <span className="font-medium">{examData.passingScore} 分</span>
                </div>
                <div className="flex justify-between text-sm border-t border-border/50 pt-3">
                  <span className="text-muted-foreground">题目数</span>
                  <span className="font-medium">{selectedQuestions.length}</span>
                </div>
              </div>

              <Button
                onClick={handlePublish}
                className="w-full btn-elegant-primary"
              >
                发布试卷
              </Button>
            </div>
          </div>
        </div>

        {/* Questions Selection */}
        <div className="mt-8">
          <div className="card-elegant">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">选择题目</h2>
              <Dialog open={showQuestionBank} onOpenChange={setShowQuestionBank}>
                <DialogTrigger asChild>
                  <Button className="btn-elegant-secondary">
                    从题库选择
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle>题库</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-[60vh]">
                    {isLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        正在加载题库...
                      </div>
                    ) : questions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        题库为空，请先在题库管理中添加题目
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {questions.map((question) => (
                          <div
                            key={question.id}
                            className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${selectedInBank.includes(question.id) 
                              ? "border-primary bg-primary/5" 
                              : "border-border/50 hover:border-border"}`}
                          >
                            <Checkbox
                              checked={selectedInBank.includes(question.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedInBank([...selectedInBank, question.id]);
                                } else {
                                  setSelectedInBank(selectedInBank.filter(id => id !== question.id));
                                }
                              }}
                              disabled={selectedQuestions.some(q => q.id === question.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                  {getTypeLabel(question.type)}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {question.points} 分
                                </span>
                              </div>
                              <p className="text-sm font-medium line-clamp-2">
                                {question.title}
                              </p>
                              {question.options && Object.keys(question.options).length > 0 && (
                                <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                                  {Object.entries(question.options)
                                    .sort(([a], [b]) => a.localeCompare(b))
                                    .slice(0, 4)
                                    .map(([key, text]) => (
                                      <li key={key} className="truncate">
                                        {key}. {text}
                                      </li>
                                    ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowQuestionBank(false)}>
                      取消
                    </Button>
                    <Button 
                      onClick={handleSelectFromBank}
                      disabled={selectedInBank.length === 0 || selectedInBank.every(id => selectedQuestions.some(q => q.id === id))}
                      className="btn-elegant-primary"
                    >
                      确认选择 ({selectedInBank.filter(id => !selectedQuestions.some(q => q.id === id)).length})
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={handleAddQuestion} className="btn-elegant-secondary ml-2">
                添加题目
              </Button>
            </div>

            {selectedQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>还未选择任何题目</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedQuestions.map((question, index) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border/50"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {index + 1}. {question.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {question.type} · {question.points} 分
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="px-3 py-1 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                      移除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}