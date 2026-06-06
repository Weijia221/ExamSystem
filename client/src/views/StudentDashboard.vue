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
              class="w-full text-left px-4 py-3 rounded-xl transition-all duration-300 cursor-pointer"
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
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">自由练习</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">从题库中随机练习题目</p>
              </div>
              <el-button
                v-if="practiceQuestions.length > 0"
                @click="resetPractice"
              >
                重新开始
              </el-button>
            </div>

            <!-- Not started -->
            <div v-if="practiceQuestions.length === 0 && !practiceLoading" class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Edit /></el-icon>
              <h3 class="text-lg font-semibold mt-4 mb-2">自由练习模式</h3>
              <p class="mb-6" style="color: var(--color-text-secondary)">
                随机练习题目，答完即时显示对错
              </p>
              <el-button
                type="primary"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                @click="startPractice"
              >
                开始练习
              </el-button>
            </div>

            <!-- Loading -->
            <div v-if="practiceLoading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">正在加载题目...</p>
            </div>

            <!-- Practice in progress -->
            <template v-if="practiceQuestions.length > 0 && !practiceLoading">
              <!-- Progress -->
              <div class="flex items-center justify-between text-sm" style="color: var(--color-text-secondary)">
                <span>第 {{ practiceIndex + 1 }} / {{ practiceQuestions.length }} 题</span>
                <span>
                  正确: <span class="font-semibold text-green-600">{{ practiceCorrect }}</span>
                  / {{ practiceAnswered }}
                </span>
              </div>

              <!-- Question -->
              <div class="card-elegant">
                <div class="flex items-center gap-3 mb-4">
                  <el-tag size="small" effect="plain">{{ getTypeLabel(currentPracticeQ.type) }}</el-tag>
                  <el-tag
                    size="small"
                    :type="currentPracticeQ.difficulty === 'easy' ? 'success' : currentPracticeQ.difficulty === 'hard' ? 'danger' : 'warning'"
                    effect="plain"
                  >
                    {{ getDifficultyLabel(currentPracticeQ.difficulty) }}
                  </el-tag>
                  <span v-if="currentPracticeQ.category" class="text-xs" style="color: var(--color-text-secondary)">
                    {{ currentPracticeQ.category }}
                  </span>
                </div>

                <p class="text-lg font-medium mb-6">{{ currentPracticeQ.title }}</p>

                <!-- Options (before answering) -->
                <template v-if="!practiceCurrentAnswered">
                  <!-- Single Choice / TrueFalse -->
                  <div v-if="currentPracticeQ.type === 'single' || currentPracticeQ.type === 'trueFalse'" class="space-y-3">
                    <div
                      v-for="(text, key) in (currentPracticeQ.options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all"
                      :style="{
                        borderColor: practiceSelected === key ? '#f9a8d4' : 'var(--color-border)',
                        background: practiceSelected === key ? 'rgba(249,168,212,0.05)' : 'transparent',
                      }"
                      @click="practiceSelected = String(key)"
                    >
                      <span class="font-medium mr-2">{{ key }}.</span>
                      <span>{{ text }}</span>
                    </div>
                  </div>

                  <!-- Multiple Choice -->
                  <div v-else-if="currentPracticeQ.type === 'multiple'" class="space-y-3">
                    <div
                      v-for="(text, key) in (currentPracticeQ.options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all"
                      :style="{
                        borderColor: practiceMultiSelected.includes(String(key)) ? '#f9a8d4' : 'var(--color-border)',
                        background: practiceMultiSelected.includes(String(key)) ? 'rgba(249,168,212,0.05)' : 'transparent',
                      }"
                      @click="togglePracticeMulti(String(key))"
                    >
                      <el-checkbox :model-value="practiceMultiSelected.includes(String(key))" class="pointer-events-none" />
                      <span class="font-medium mx-2">{{ key }}.</span>
                      <span>{{ text }}</span>
                    </div>
                  </div>

                  <!-- Fill Blank -->
                  <div v-else-if="currentPracticeQ.type === 'fillBlank'">
                    <el-input
                      v-model="practiceFillAnswer"
                      placeholder="请输入答案..."
                      size="large"
                    />
                  </div>

                  <!-- Essay -->
                  <div v-else-if="currentPracticeQ.type === 'essay'">
                    <el-input
                      v-model="practiceEssayAnswer"
                      type="textarea"
                      :rows="6"
                      placeholder="请输入你的回答..."
                    />
                  </div>

                  <div class="mt-6 flex justify-end">
                    <el-button
                      type="primary"
                      style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                      :disabled="!hasPracticeAnswer"
                      @click="submitPracticeAnswer"
                    >
                      确认答案
                    </el-button>
                  </div>
                </template>

                <!-- Result (after answering) -->
                <template v-else>
                  <!-- Essay result -->
                  <div v-if="currentPracticeQ.type === 'essay'" class="space-y-3">
                    <div class="p-4 rounded-xl border-2" style="border-color: #f9a8d4; background: rgba(249,168,212,0.03)">
                      <p class="text-sm font-medium mb-2" style="color: var(--color-text-secondary)">你的回答：</p>
                      <p class="text-sm whitespace-pre-wrap">{{ practiceSubmittedAnswer || '未作答' }}</p>
                    </div>
                    <div class="p-4 rounded-xl border-2" style="border-color: #22c55e; background: rgba(34,197,94,0.03)">
                      <p class="text-sm font-medium mb-2" style="color: var(--color-text-secondary)">参考答案：</p>
                      <p class="text-sm whitespace-pre-wrap">{{ currentPracticeQ.correctAnswer }}</p>
                    </div>
                  </div>

                  <!-- Show all options with correct/incorrect styling -->
                  <div v-else-if="currentPracticeQ.type !== 'fillBlank'" class="space-y-3">
                    <div
                      v-for="(text, key) in (currentPracticeQ.options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2"
                      :style="{
                        borderColor: isCorrectOption(String(key)) ? '#22c55e' : isWrongSelection(String(key)) ? '#ef4444' : isMissedCorrect(String(key)) ? '#eab308' : 'var(--color-border)',
                        background: isCorrectOption(String(key)) ? 'rgba(34,197,94,0.05)' : isWrongSelection(String(key)) ? 'rgba(239,68,68,0.05)' : isMissedCorrect(String(key)) ? 'rgba(234,179,8,0.05)' : 'transparent',
                      }"
                    >
                      <span class="font-medium mr-2">{{ key }}.</span>
                      <span>{{ text }}</span>
                      <el-icon v-if="isCorrectOption(String(key))" class="ml-auto text-green-600"><CircleCheck /></el-icon>
                      <el-icon v-else-if="isWrongSelection(String(key))" class="ml-auto text-red-600"><CircleClose /></el-icon>
                      <el-icon v-else-if="isMissedCorrect(String(key))" class="ml-auto text-yellow-500"><WarningFilled /></el-icon>
                    </div>
                  </div>
                  <div v-else class="p-4 rounded-xl border-2 space-y-2" :style="{ borderColor: practiceIsCorrect ? '#22c55e' : '#ef4444', background: practiceIsCorrect ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)' }">
                    <p class="text-sm" style="color: var(--color-text-secondary)">你的答案:
                      <span :class="practiceIsCorrect ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ practiceSubmittedAnswer || '未作答' }}</span>
                    </p>
                    <p class="text-sm" style="color: var(--color-text-secondary)">正确答案:
                      <span class="text-green-600 font-medium">{{ currentPracticeQ.correctAnswer }}</span>
                    </p>
                  </div>

                  <!-- Result banner -->
                  <div
                    class="mt-4 p-4 rounded-xl text-center font-semibold"
                    :style="{
                      background: currentPracticeQ.type === 'essay' ? 'rgba(249,168,212,0.1)' : practiceIsCorrect ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      color: currentPracticeQ.type === 'essay' ? '#ec4899' : practiceIsCorrect ? '#22c55e' : '#ef4444',
                    }"
                  >
                    {{ currentPracticeQ.type === 'essay' ? '请对照参考答案自查' : practiceIsCorrect ? '回答正确！' : '回答错误' }}
                  </div>

                  <!-- Explanation -->
                  <div v-if="currentPracticeQ.explanation" class="mt-4 p-4 rounded-xl" style="background: var(--color-muted)">
                    <p class="text-sm font-medium mb-1">答案解析</p>
                    <p class="text-sm" style="color: var(--color-text-secondary)">{{ currentPracticeQ.explanation }}</p>
                  </div>

                  <div class="mt-6 flex justify-end">
                    <el-button
                      type="primary"
                      style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                      @click="nextPractice"
                    >
                      {{ practiceIndex < practiceQuestions.length - 1 ? '下一题' : '查看结果' }}
                    </el-button>
                  </div>
                </template>
              </div>
            </template>

            <!-- Finished -->
            <div v-if="practiceFinished" class="card-elegant text-center py-12">
              <h3 class="text-2xl font-bold mb-4">练习完成！</h3>
              <div class="mb-6">
                <p class="text-4xl font-black mb-2" style="color: #f9a8d4">
                  {{ practiceCorrect }} / {{ practiceQuestions.length }}
                </p>
                <p style="color: var(--color-text-secondary)">
                  正确率: {{ practiceQuestions.length > 0 ? Math.round((practiceCorrect / practiceQuestions.length) * 100) : 0 }}%
                </p>
              </div>
              <el-button
                type="primary"
                style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                @click="resetPractice"
              >
                再来一次
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
                <div class="flex items-center gap-3">
                  <el-button
                    type="primary"
                    :disabled="exam.hasTaken && !exam.allowRetake"
                    style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
                    @click="startExam(exam.id)"
                  >
                    {{ exam.hasTaken && !exam.allowRetake ? '已参加' : exam.hasTaken ? '再次考试' : '参加考试' }}
                  </el-button>
                </div>
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

    <!-- AI Chat -->
    <AiChat
      :context="currentPracticeQ ? { questionTitle: currentPracticeQ.title } : undefined"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { Loading, Edit, Notebook, DataAnalysis, Clock, Star, CircleCheck, CircleClose, WarningFilled } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { studentExamsApi } from "../api";
import AiChat from "../components/AiChat.vue";
import type { Exam, Question } from "../types";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<"practice" | "exams" | "scores">("practice");
const availableExams = ref<(Exam & { hasTaken: boolean })[]>([]);
const loading = ref(true);

const menuItems = [
  { id: "practice" as const, label: "自由练习", description: "练习题库中的题目" },
  { id: "exams" as const, label: "参加考试", description: "参加教师发布的考试" },
  { id: "scores" as const, label: "查看分数", description: "查看历史成绩" },
];

// Practice state
interface PracticeQuestion extends Question {
  correctAnswer: string;
  explanation: string | null;
}
const practiceQuestions = ref<PracticeQuestion[]>([]);
const practiceLoading = ref(false);
const practiceIndex = ref(0);
const practiceAnswered = ref(0);
const practiceCorrect = ref(0);
const practiceFinished = ref(false);
const practiceSelected = ref("");
const practiceMultiSelected = ref<string[]>([]);
const practiceFillAnswer = ref("");
const practiceEssayAnswer = ref("");
const practiceSubmittedAnswer = ref("");
const practiceIsCorrect = ref(false);
const practiceCurrentAnswered = ref(false);

const currentPracticeQ = computed(() => practiceQuestions.value[practiceIndex.value]);

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题", essay: "问答题",
};
const difficultyLabels: Record<string, string> = {
  easy: "简单", medium: "中等", hard: "困难",
};
const getTypeLabel = (t: string) => typeLabels[t] ?? t;
const getDifficultyLabel = (d: string) => difficultyLabels[d] ?? d;

const hasPracticeAnswer = computed(() => {
  if (!currentPracticeQ.value) return false;
  if (currentPracticeQ.value.type === "multiple") return practiceMultiSelected.value.length > 0;
  if (currentPracticeQ.value.type === "fillBlank") return practiceFillAnswer.value.trim() !== "";
  if (currentPracticeQ.value.type === "essay") return practiceEssayAnswer.value.trim() !== "";
  return practiceSelected.value !== "";
});

const togglePracticeMulti = (key: string) => {
  const idx = practiceMultiSelected.value.indexOf(key);
  if (idx >= 0) {
    practiceMultiSelected.value.splice(idx, 1);
  } else {
    practiceMultiSelected.value.push(key);
    practiceMultiSelected.value.sort();
  }
};

const isCorrectOption = (key: string) => {
  const q = currentPracticeQ.value;
  if (!q) return false;
  if (q.type === "multiple") {
    return practiceMultiSelected.value.includes(key) && q.correctAnswer.split(",").filter(Boolean).includes(key);
  }
  return q.correctAnswer === key;
};

const isWrongSelection = (key: string) => {
  const q = currentPracticeQ.value;
  if (!q) return false;
  if (q.type === "multiple") {
    return practiceMultiSelected.value.includes(key) && !q.correctAnswer.split(",").filter(Boolean).includes(key);
  }
  return practiceSubmittedAnswer.value === key && q.correctAnswer !== key;
};

const isMissedCorrect = (key: string) => {
  const q = currentPracticeQ.value;
  if (!q || q.type !== "multiple") return false;
  return !practiceMultiSelected.value.includes(key) && q.correctAnswer.split(",").filter(Boolean).includes(key);
};

const submitPracticeAnswer = () => {
  const q = currentPracticeQ.value;
  if (!q) return;

  let studentAnswer = "";
  if (q.type === "multiple") {
    studentAnswer = practiceMultiSelected.value.sort().join(",");
  } else if (q.type === "fillBlank") {
    studentAnswer = practiceFillAnswer.value.trim();
  } else if (q.type === "essay") {
    studentAnswer = practiceEssayAnswer.value.trim();
  } else {
    studentAnswer = practiceSelected.value;
  }

  practiceSubmittedAnswer.value = studentAnswer;

  if (q.type === "essay") {
    // 问答题不自动判对错，设为 true 以显示参考答案
    practiceIsCorrect.value = true;
  } else if (q.type === "multiple") {
    const correctSet = new Set(q.correctAnswer.split(",").filter(Boolean));
    const answerSet = new Set(studentAnswer.split(",").filter(Boolean));
    const correctSelected = [...answerSet].filter((a) => correctSet.has(a)).length;
    practiceIsCorrect.value = correctSet.size === correctSelected && answerSet.size === correctSet.size;
  } else if (q.type === "fillBlank") {
    const correctAnswers = q.correctAnswer.split("|").map((a) => a.trim().toLowerCase());
    practiceIsCorrect.value = correctAnswers.includes(studentAnswer.toLowerCase());
  } else {
    practiceIsCorrect.value = studentAnswer === q.correctAnswer;
  }

  practiceAnswered.value++;
  if (practiceIsCorrect.value) practiceCorrect.value++;
  practiceCurrentAnswered.value = true;
};

const nextPractice = () => {
  if (practiceIndex.value < practiceQuestions.value.length - 1) {
    practiceIndex.value++;
    practiceSelected.value = "";
    practiceMultiSelected.value = [];
    practiceFillAnswer.value = "";
    practiceEssayAnswer.value = "";
    practiceSubmittedAnswer.value = "";
    practiceIsCorrect.value = false;
    practiceCurrentAnswered.value = false;
  } else {
    practiceFinished.value = true;
  }
};

const startPractice = async () => {
  practiceLoading.value = true;
  practiceFinished.value = false;
  practiceIndex.value = 0;
  practiceAnswered.value = 0;
  practiceCorrect.value = 0;
  practiceSelected.value = "";
  practiceMultiSelected.value = [];
  practiceFillAnswer.value = "";
  practiceEssayAnswer.value = "";
  practiceSubmittedAnswer.value = "";
  practiceIsCorrect.value = false;
  practiceCurrentAnswered.value = false;
  try {
    practiceQuestions.value = await studentExamsApi.practiceQuestions();
    if (practiceQuestions.value.length === 0) {
      ElMessage.info("题库暂无题目");
    }
  } catch {
    practiceQuestions.value = [];
    ElMessage.error("加载题目失败");
  } finally {
    practiceLoading.value = false;
  }
};

const resetPractice = () => {
  practiceQuestions.value = [];
  practiceFinished.value = false;
  practiceIndex.value = 0;
  practiceAnswered.value = 0;
  practiceCorrect.value = 0;
  practiceCurrentAnswered.value = false;
  practiceEssayAnswer.value = "";
};

const loadData = async () => {
  loading.value = true;
  try {
    availableExams.value = await studentExamsApi.listAvailable();
  } catch (err: any) {
    availableExams.value = [];
    if (err?.response?.status === 401) {
      ElMessage.error("登录已过期，请重新登录");
      router.push("/role-select");
    }
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

<style scoped>
button:not([style*="linear-gradient"]):hover {
  background: rgba(236, 72, 153, 0.1) !important;
  border-color: #ec4899 !important;
}
</style>
