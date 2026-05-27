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
      <div class="max-w-4xl w-full space-y-12 animate-fade-in-up">
        <div class="text-center space-y-4">
          <h1 class="text-4xl md:text-5xl font-bold">选择您的身份</h1>
          <p class="text-lg" style="color: var(--color-text-secondary)">
            请选择您的角色开始使用系统
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Teacher Card -->
          <div
            class="card-elegant text-left cursor-pointer group relative overflow-hidden"
            :class="{ 'ring-2 ring-indigo-500 shadow-lg': selectedRole === 'teacher' }"
            :style="{ opacity: loading && selectedRole !== 'teacher' ? 0.5 : 1 }"
            @click="handleSelect('teacher')"
          >
            <div
              class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style="background: linear-gradient(135deg, rgba(249,168,212,0.05), transparent)"
            ></div>

            <div class="relative space-y-6">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center"
                    style="background: rgba(249,168,212,0.1)"
                  >
                    <el-icon :size="24" style="color: #f9a8d4"><UserFilled /></el-icon>
                  </div>
                  <h2 class="text-2xl font-bold">教师</h2>
                </div>
                <p style="color: var(--color-text-secondary); line-height: 1.6">
                  创建和管理题库，发布考试试卷，查看学生成绩和答题分析
                </p>
              </div>

              <ul class="space-y-2 text-sm" style="color: var(--color-text-secondary)">
                <li class="flex items-center gap-2">
                  <el-icon style="color: #f9a8d4"><Check /></el-icon>
                  题库管理
                </li>
                <li class="flex items-center gap-2">
                  <el-icon style="color: #f9a8d4"><Check /></el-icon>
                  试卷发布
                </li>
                <li class="flex items-center gap-2">
                  <el-icon style="color: #f9a8d4"><Check /></el-icon>
                  成绩查看
                </li>
              </ul>

              <el-button
                type="primary"
                class="w-full"
                style="height: 44px; border-radius: 10px; font-weight: 600"
                :loading="loading && selectedRole === 'teacher'"
              >
                选择教师
              </el-button>
            </div>
          </div>

          <!-- Student Card -->
          <div
            class="card-elegant text-left cursor-pointer group relative overflow-hidden"
            :class="{ 'ring-2 ring-pink-500 shadow-lg': selectedRole === 'student' }"
            :style="{ opacity: loading && selectedRole !== 'student' ? 0.5 : 1 }"
            @click="handleSelect('student')"
          >
            <div
              class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style="background: linear-gradient(135deg, rgba(236,72,153,0.05), transparent)"
            ></div>

            <div class="relative space-y-6">
              <div class="space-y-3">
                <div class="flex items-center gap-3">
                  <div
                    class="w-12 h-12 rounded-xl flex items-center justify-center"
                    style="background: rgba(236,72,153,0.1)"
                  >
                    <el-icon :size="24" style="color: #ec4899"><Reading /></el-icon>
                  </div>
                  <h2 class="text-2xl font-bold">学生</h2>
                </div>
                <p style="color: var(--color-text-secondary); line-height: 1.6">
                  练习题库中的题目，参加教师发布的考试，查看成绩和答题详情
                </p>
              </div>

              <ul class="space-y-2 text-sm" style="color: var(--color-text-secondary)">
                <li class="flex items-center gap-2">
                  <el-icon style="color: #ec4899"><Check /></el-icon>
                  自由练习
                </li>
                <li class="flex items-center gap-2">
                  <el-icon style="color: #ec4899"><Check /></el-icon>
                  参加考试
                </li>
                <li class="flex items-center gap-2">
                  <el-icon style="color: #ec4899"><Check /></el-icon>
                  成绩查询
                </li>
              </ul>

              <el-button
                type="danger"
                class="w-full"
                style="height: 44px; border-radius: 10px; font-weight: 600; background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                :loading="loading && selectedRole === 'student'"
              >
                选择学生
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft, UserFilled, Reading, Check } from "@element-plus/icons-vue";

const router = useRouter();
const selectedRole = ref<string | null>(null);
const loading = ref(false);

const handleSelect = async (role: "teacher" | "student") => {
  selectedRole.value = role;
  loading.value = true;
  setTimeout(() => {
    if (role === "teacher") {
      router.push("/teacher/dashboard");
    } else {
      router.push("/student/dashboard");
    }
  }, 500);
};
</script>
