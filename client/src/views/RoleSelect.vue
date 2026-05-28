<template>
  <div
    class="min-h-screen flex flex-col"
    style="background: linear-gradient(135deg, var(--color-background), rgba(249,168,212,0.03))"
  >
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <el-button text @click="$router.push('/')">
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <span class="text-lg font-bold gradient-text">ExamHub</span>
        <div style="width: 64px"></div>
      </div>
    </header>

    <main class="flex-1 flex flex-col items-center justify-center px-4 py-20">
      <div class="max-w-md w-full space-y-8 animate-fade-in-up">
        <div class="text-center space-y-4">
          <h1 class="text-4xl font-bold">登录</h1>
          <p class="text-lg" style="color: var(--color-text-secondary)">
            请输入账号密码登录系统
          </p>
        </div>

        <div class="card-elegant space-y-6">
          <el-form label-position="top" @submit.prevent="handleLogin">
            <el-form-item label="账号">
              <el-input
                v-model="username"
                placeholder="请输入账号"
                size="large"
                :prefix-icon="User"
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-form-item label="密码">
              <el-input
                v-model="password"
                type="password"
                placeholder="请输入密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
              />
            </el-form-item>

            <el-button
              type="primary"
              class="w-full"
              size="large"
              style="height: 44px; border-radius: 10px; font-weight: 600"
              :loading="loading"
              @click="handleLogin"
            >
              登录
            </el-button>
          </el-form>

          <div
            v-if="errorMsg"
            class="text-center text-sm text-red-500"
          >
            {{ errorMsg }}
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, User, Lock } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";

const router = useRouter();
const authStore = useAuthStore();

const username = ref("");
const password = ref("");
const loading = ref(false);
const errorMsg = ref("");

const handleLogin = async () => {
  errorMsg.value = "";
  if (!username.value.trim()) {
    errorMsg.value = "请输入账号";
    return;
  }
  if (!password.value.trim()) {
    errorMsg.value = "请输入密码";
    return;
  }

  loading.value = true;
  try {
    await authStore.login(username.value.trim(), password.value.trim());
    const role = authStore.user?.role;
    if (role === "admin") {
      router.push("/admin/dashboard");
    } else if (role === "teacher") {
      router.push("/teacher/dashboard");
    } else {
      router.push("/student/dashboard");
    }
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.error || "登录失败，请检查账号密码";
  } finally {
    loading.value = false;
  }
};
</script>
