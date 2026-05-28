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
          <p class="text-xs" style="color: var(--color-text-secondary)">教师管理系统</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-medium">{{ authStore.user?.name || authStore.user?.email || "教师" }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary)">教师</p>
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
                  ? 'background: linear-gradient(135deg, #f9a8d4, #f472b6); color: white; box-shadow: 0 4px 12px rgba(249,168,212,0.3)'
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
                <span v-if="item.id === 'questions' && questions.length > 0">
                  · {{ questions.length }} 题
                </span>
              </p>
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="lg:col-span-3">
          <!-- Questions Tab -->
          <div v-if="activeTab === 'questions'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">题库管理</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">
                  创建和管理您的题目库
                  <span v-if="questions.length > 0" style="color: #f9a8d4; font-weight: 500">
                    · 共 {{ questions.length }} 道题
                  </span>
                </p>
              </div>
              <el-button type="primary" @click="$router.push('/question-bank')">
                管理题库
              </el-button>
            </div>

            <div v-if="loading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">正在加载题目...</p>
            </div>

            <template v-else-if="questions.length === 0">
              <div class="card-elegant text-center py-12">
                <el-icon :size="48" style="color: var(--color-border)"><Document /></el-icon>
                <h3 class="text-lg font-semibold mt-4 mb-2">暂无题目</h3>
                <p class="mb-6" style="color: var(--color-text-secondary)">
                  开始创建您的第一道题目吧
                </p>
                <el-button type="primary" @click="$router.push('/question-bank')">
                  创建题目
                </el-button>
              </div>
            </template>

            <template v-else>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div v-for="stat in stats" :key="stat.label" class="card-elegant text-center py-4">
                  <p class="text-2xl font-bold" style="color: #f9a8d4">{{ stat.value }}</p>
                  <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ stat.label }}</p>
                </div>
              </div>

              <div class="card-elegant">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold">最近题目</h3>
                </div>
                <div class="space-y-3">
                  <div
                    v-for="(question, index) in questions.slice(0, 8)"
                    :key="question.id"
                    class="flex items-start gap-4 p-4 rounded-xl border"
                    style="border-color: var(--color-border); background: rgba(248,250,252,0.5)"
                  >
                    <div class="flex-1 min-w-0">
                      <div class="flex flex-wrap items-center gap-2 mb-1">
                        <span class="text-sm font-semibold" style="color: #f9a8d4">{{ index + 1 }}</span>
                        <el-tag size="small" effect="plain">{{ getTypeLabel(question.type) }}</el-tag>
                        <span class="text-xs" style="color: var(--color-text-secondary)">
                          {{ getDifficultyLabel(question.difficulty) }}
                        </span>
                      </div>
                      <p class="text-sm font-medium truncate">{{ question.title }}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-6 flex justify-center">
                  <el-button @click="$router.push('/question-bank')">查看全部题目</el-button>
                </div>
              </div>
            </template>
          </div>

          <!-- Exams Tab -->
          <div v-if="activeTab === 'exams'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">试卷发布</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">组卷并发布考试</p>
              </div>
              <el-button type="primary" @click="$router.push('/exam-creation')">
                新增试卷
              </el-button>
            </div>

            <div v-if="exams.length === 0" class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">暂无试卷</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">创建试卷后，学生可以参加考试</p>
              <el-button type="primary" @click="$router.push('/exam-creation')">创建试卷</el-button>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="exam in exams"
                :key="exam.id"
                class="card-elegant"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold">{{ exam.title }}</h3>
                    <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
                      {{ exam.duration }} 分钟 · {{ exam.totalPoints }} 分
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <el-tag :type="exam.status === 'published' ? 'success' : 'info'" effect="plain">
                      {{ exam.status === "published" ? "已发布" : exam.status === "draft" ? "草稿" : "已关闭" }}
                    </el-tag>
                    <el-button
                      v-if="exam.status === 'draft'"
                      size="small"
                      type="primary"
                      @click="publishExam(exam.id)"
                    >
                      发布
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      text
                      @click="deleteExam(exam.id)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Scores Tab -->
          <div v-if="activeTab === 'scores'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">查看分数</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">查看学生的考试成绩</p>
              </div>
              <el-button type="primary" @click="$router.push('/teacher/scores')">
                查看详情
              </el-button>
            </div>

            <div class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><DataAnalysis /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">成绩概览</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">学生完成考试后，成绩将显示在这里</p>
              <el-button type="primary" @click="$router.push('/teacher/scores')">查看成绩管理</el-button>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, Document, Notebook, DataAnalysis } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { questionsApi, examsApi } from "../api";
import type { Question, Exam } from "../types";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<"questions" | "exams" | "scores">("questions");
const questions = ref<Question[]>([]);
const exams = ref<Exam[]>([]);
const loading = ref(true);

const menuItems = [
  { id: "questions" as const, label: "题库管理", description: "创建、编辑和管理题目" },
  { id: "exams" as const, label: "试卷发布", description: "组卷和发布考试" },
  { id: "scores" as const, label: "查看分数", description: "查看学生成绩" },
];

const stats = computed(() => [
  { value: questions.value.length, label: "总题数" },
  { value: questions.value.filter((q) => q.difficulty === "easy").length, label: "简单" },
  { value: questions.value.filter((q) => q.difficulty === "medium").length, label: "中等" },
  { value: questions.value.filter((q) => q.difficulty === "hard").length, label: "困难" },
]);

const typeLabels: Record<string, string> = {
  single: "单选题",
  multiple: "多选题",
  trueFalse: "判断题",
  fillBlank: "填空题",
};

const difficultyLabels: Record<string, string> = {
  easy: "简单",
  medium: "中等",
  hard: "困难",
};

const getTypeLabel = (type: string) => typeLabels[type] ?? type;
const getDifficultyLabel = (d: string) => difficultyLabels[d] ?? d;

const loadData = async () => {
  loading.value = true;
  try {
    const [q, e] = await Promise.all([questionsApi.list(), examsApi.list()]);
    questions.value = q;
    exams.value = e;
  } catch {
    // Silently fail, show empty state
  } finally {
    loading.value = false;
  }
};

const publishExam = async (id: number) => {
  try {
    await examsApi.publish(id);
    ElMessage.success("试卷已发布");
    await loadData();
  } catch {
    ElMessage.error("发布失败");
  }
};

const deleteExam = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "删除试卷将同时删除所有学生的考试成绩，此操作不可恢复。确定要删除吗？",
      "确认删除",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
    );
    await examsApi.delete(id);
    ElMessage.success("试卷已删除");
    await loadData();
  } catch {
    // cancelled
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

onMounted(loadData);
</script>
