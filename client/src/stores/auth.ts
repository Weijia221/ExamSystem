import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { User } from "../types";
import { authApi } from "../api";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null);
  const loading = ref(false);

  const isAuthenticated = computed(() => !!user.value);
  const isAdmin = computed(() => user.value?.role === "admin");
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

  async function login(username: string, password: string) {
    const result = await authApi.login(username, password);
    localStorage.setItem("loginRole", username);
    user.value = result;
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("loginRole");
      user.value = null;
    }
  }

  return {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isTeacher,
    isStudent,
    fetchUser,
    login,
    logout,
  };
});
