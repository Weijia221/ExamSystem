import { useAuth } from "@/_core/hooks/useAuth";
import {
  loadQuestionsFromStorage,
  mapDbQuestion,
  saveQuestionsToStorage,
  type TeacherQuestion,
} from "@/lib/questions";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useState } from "react";

export function useTeacherQuestions() {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<TeacherQuestion[]>(
    loadQuestionsFromStorage
  );

  const listQuery = trpc.questions.list.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const syncFromStorage = useCallback(() => {
    setQuestions(loadQuestionsFromStorage());
  }, []);

  useEffect(() => {
    if (listQuery.data && isAuthenticated) {
      const mapped = listQuery.data.map(mapDbQuestion);
      setQuestions(mapped);
      saveQuestionsToStorage(mapped);
    }
  }, [listQuery.data, isAuthenticated]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        if (isAuthenticated) {
          void listQuery.refetch();
        } else {
          syncFromStorage();
        }
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isAuthenticated, listQuery, syncFromStorage]);

  return {
    questions,
    isLoading: isAuthenticated && listQuery.isLoading,
    refetch: listQuery.refetch,
    syncFromStorage,
  };
}
