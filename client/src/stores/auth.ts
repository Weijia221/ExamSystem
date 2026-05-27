import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";
import { authApi } from "../api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isTeacher = computed(() => user.value?.role === "teacher" || user.value?.role === "admin");
  const isStudent = computed(() => user.value?.role === "student");

  async function fetchUser() {
    loading.value = true;
    try {
      user.value = await authApi.me();
    } catch {
      user.value = null;
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      user.value = null;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    isTeacher,
    isStudent,
    fetchUser,
    logout,
  };
});
