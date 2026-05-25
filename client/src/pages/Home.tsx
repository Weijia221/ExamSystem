import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();

  const handleStart = () => {
    navigate("/role-select");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-secondary/5 blur-[120px]" />
      </div>

      <main className="flex-1 flex items-center justify-center px-4 relative z-10">
        <div className="max-w-2xl w-full text-center space-y-10 animate-in fade-in zoom-in duration-700">
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-7xl md:text-8xl font-black tracking-tighter gradient-text">
                ExamHub
              </h1>
              <p className="text-xl md:text-2xl font-medium text-muted-foreground tracking-wide">
                现代化在线考试与测评平台
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <Button
              size="lg"
              className="h-16 px-10 text-lg font-bold rounded-full shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 bg-primary text-primary-foreground"
              onClick={handleStart}
            >
              开始使用
            </Button>
            <p className="text-sm text-muted-foreground/60">
              支持教师组卷、学生在线答题与自动评分
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground/40 relative z-10">
        <p>© 2026 ExamHub · 开启智能测评新时代</p>
      </footer>
    </div>
  );
}
