import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import RoleSelect from "./pages/RoleSelect";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import QuestionBank from "./pages/QuestionBank";
import ExamCreation from "./pages/ExamCreation";
import StudentExam from "./pages/StudentExam";
import TeacherScores from "./pages/TeacherScores";
import StudentScores from "./pages/StudentScores";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path="/role-select" component={RoleSelect} />
      <Route path="/teacher/dashboard" component={TeacherDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/question-bank" component={QuestionBank} />
      <Route path="/exam-creation" component={ExamCreation} />
      <Route path="/student/exam" component={StudentExam} />
      <Route path="/teacher/scores" component={TeacherScores} />
      <Route path="/student/scores" component={StudentScores} />
      <Route path="/404" component={NotFound} />
      <Route path="/" component={Home} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
