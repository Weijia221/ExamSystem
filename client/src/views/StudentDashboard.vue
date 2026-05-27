<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <div>
          <h1 class="text-lg font-bold gradient-text">ExamHub</h1>
          <p class="text-xs" style="color: var(--color-text-secondary)">学生考试系统</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-medium">{{ authStore.user?.name || authStore.user?.email || "学生" }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary)">学生</p>
          </div>
          <el-button size="small" @click="handleLogout">退出</el-button>
        </div>
      </div>
    </header>

    <div class="container py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <nav class="space-y-2 sticky top-24">
            <button
              v-for="item in menuItems"
              :key="item.id"
              class="w-full text-left px-4 py-3 rounded-xl transition-all duration-300"
              :style="
                activeTab === item.id
                  ? 'background: linear-gradient(135deg, #ec4899, #db2777); color: white; box-shadow: 0 4px 12px rgba(236,72,153,0.3)'
                  : 'color: var(--color-text); border: 1px solid var(--color-border)'
              "
              @click="activeTab = item.id"
            >
              <p class="font-medium text-sm">{{ item.label }}</p>
              <p
                class="text-xs mt-0.5"
                :style="{ opacity: activeTab === item.id ? 0.7 : 0.6 }"
              >
                {{ item.description }}
              </p>
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="lg:col-span-3">
          <!-- Practice Tab -->
          <div v-if="activeTab === 'practice'" class="space-y-6 animate-fade-in">
            <div>
              <h2 class="text-3xl font-bold">自由练习</h2>
              <p class="mt-1" style="color: var(--color-text-secondary)">从题库中随机抽取题目进行练习</p>
            </div>

            <div class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Edit /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">自由练习模式</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">
                随机练习题目，提升答题能力
              </p>
              <el-button
                type="primary"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                @click="$router.push('/student/exam')"
              >
                开始练习
              </el-button>
            </div>
          </div>

          <!-- Exams Tab -->
          <div v-if="activeTab === 'exams'" class="space-y-6 animate-fade-in">
            <div>
              <h2 class="text-3xl font-bold">参加考试</h2>
              <p class="mt-1" style="color: var(--color-text-secondary)">查看并参加教师发布的考试</p>
            </div>

            <div v-if="loading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #ec4899"><Loading /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">正在加载考试列表...</p>
            </div>

            <div v-else-if="availableExams.length === 0" class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">暂无可用考试</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">教师还未发布考试，请稍后再试</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="exam in availableExams"
                :key="exam.id"
                class="card-elegant flex items-center justify-between"
              >
                <div>
                  <h3 class="font-semibold text-lg">{{ exam.title }}</h3>
                  <p v-if="exam.description" class="text-sm mt-1" style="color: var(--color-text-secondary)">
                    {{ exam.description }}
                  </p>
                  <div class="flex items-center gap-4 mt-2 text-sm" style="color: var(--color-text-secondary)">
                    <span>
                      <el-icon class="mr-1"><Clock /></el-icon>
                      {{ exam.duration }} 分钟
                    </span>
                    <span>
                      <el-icon class="mr-1"><Star /></el-icon>
                      {{ exam.totalPoints }} 分
                    </span>
                    <span v-if="exam.passingScore">
                      及格: {{ exam.passingScore }} 分
                    </span>
                  </div>
                </div>
                <el-button
                  type="primary"
                  style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                  @click="startExam(exam.id)"
                >
                  参加考试
                </el-button>
              </div>
            </div>
          </div>

          <!-- Scores Tab -->
          <div v-if="activeTab === 'scores'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">查看分数</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">查看您的历史考试成绩</p>
              </div>
              <el-button
                type="primary"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                @click="$router.push('/student/scores')"
              >
                查看详情
              </el-button>
            </div>

            <div class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><DataAnalysis /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">成绩概览</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">完成考试后，成绩将显示在这里</p>
              <el-button
                type="primary"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                @click="$router.push('/student/scores')"
              >
                查看我的成绩
              </el-button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Loading, Edit, Notebook, DataAnalysis, Clock, Star } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { studentExamsApi } from "../api";
import type { Exam } from "../types";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<"practice" | "exams" | "scores">("practice");
const availableExams = ref<Exam[]>([]);
const loading = ref(true);

const menuItems = [
  { id: "practice" as const, label: "自由练习", description: "练习题库中的题目" },
  { id: "exams" as const, label: "参加考试", description: "参加教师发布的考试" },
  { id: "scores" as const, label: "查看分数", description: "查看历史成绩" },
];

const loadData = async () => {
  loading.value = true;
  try {
    availableExams.value = await studentExamsApi.listAvailable();
  } catch {
    availableExams.value = [];
  } finally {
    loading.value = false;
  }
};

const startExam = (examId: number) => {
  router.push({ path: "/student/exam", query: { examId: String(examId) } });
};

watch(activeTab, (tab) => {
  if (tab === "exams") loadData();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

onMounted(loadData);
</script>
