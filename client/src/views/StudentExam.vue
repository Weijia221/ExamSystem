<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Submitted Result -->
    <div v-if="submitted" class="min-h-screen flex items-center justify-center p-4">
      <div class="card-elegant max-w-md w-full text-center animate-scale-in">
        <!-- 有问答题：等待教师批阅 -->
        <template v-if="submitResult.hasEssay">
          <div class="mb-6">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style="background: linear-gradient(135deg, rgba(249,168,212,0.1), rgba(236,72,153,0.1))"
            >
              <span class="text-4xl">📝</span>
            </div>
            <h1 class="text-2xl font-bold mb-2">考试已提交</h1>
            <p style="color: var(--color-text-secondary)">试卷中包含问答题，等待教师批阅后公布成绩</p>
          </div>

          <div class="space-y-3 mb-6 text-left p-4 rounded-xl" style="background: var(--color-muted)">
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">总题数</span>
              <span class="font-medium">{{ questions.length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">答题数</span>
              <span class="font-medium">{{ Object.keys(answers).length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">状态</span>
              <el-tag type="warning" effect="plain">等待教师批阅</el-tag>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">切屏次数</span>
              <span class="font-medium" :style="{ color: switchCount >= MAX_SWITCHES ? '#ef4444' : 'inherit' }">
                {{ switchCount }} / {{ MAX_SWITCHES }}
              </span>
            </div>
          </div>
        </template>

        <!-- 无问答题：直接显示成绩 -->
        <template v-else>
          <div class="mb-6">
            <div
              class="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4"
              style="background: linear-gradient(135deg, rgba(249,168,212,0.1), rgba(236,72,153,0.1))"
            >
              <span class="text-4xl font-black gradient-text">{{ submitResult.score }}</span>
            </div>
            <h1 class="text-2xl font-bold mb-2">考试完成</h1>
            <p style="color: var(--color-text-secondary)">您的成绩已提交！</p>
          </div>

          <div class="space-y-3 mb-6 text-left p-4 rounded-xl" style="background: var(--color-muted)">
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">总题数</span>
              <span class="font-medium">{{ questions.length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">答题数</span>
              <span class="font-medium">{{ Object.keys(answers).length }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">得分</span>
              <span class="font-medium text-lg" style="color: #f9a8d4">
                {{ submitResult.score }} / {{ submitResult.totalPoints }}
              </span>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">结果</span>
              <el-tag :type="submitResult.score >= submitResult.passingScore ? 'success' : 'danger'">
                {{ submitResult.score >= submitResult.passingScore ? "及格" : "未及格" }}
              </el-tag>
            </div>
            <div class="flex justify-between text-sm">
              <span style="color: var(--color-text-secondary)">切屏次数</span>
              <span class="font-medium" :style="{ color: switchCount >= MAX_SWITCHES ? '#ef4444' : 'inherit' }">
                {{ switchCount }} / {{ MAX_SWITCHES }}
              </span>
            </div>
          </div>
        </template>

        <el-button type="primary" class="w-full" @click="$router.push('/student/dashboard')">
          返回学生中心
        </el-button>
      </div>
    </div>

    <!-- Exam Interface -->
    <template v-else>
      <!-- Header -->
      <header
        class="border-b sticky top-0 z-50 backdrop-blur-sm"
        style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
      >
        <div class="container flex items-center justify-between h-16">
          <div class="flex items-center gap-2">
            <h1 class="text-lg font-bold gradient-text">
              {{ examInfo?.title || "在线考试" }}
            </h1>
          </div>
          <div
            class="flex items-center gap-2 px-4 py-2 rounded-lg"
            :style="{
              background: isTimeWarning ? 'rgba(236,72,153,0.15)' : 'rgba(249,168,212,0.1)',
              color: isTimeWarning ? '#db2777' : '#f9a8d4',
            }"
          >
            <el-icon><Clock /></el-icon>
            <span class="font-semibold tabular-nums">{{ formatTime(timeLeft) }}</span>
          </div>
        </div>
      </header>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-32">
        <div class="text-center">
          <el-icon class="is-loading" :size="40" style="color: #f9a8d4"><Loading /></el-icon>
          <p class="mt-4" style="color: var(--color-text-secondary)">正在加载考试...</p>
        </div>
      </div>

      <!-- Forbidden: already taken -->
      <div v-else-if="forbidden" class="flex items-center justify-center py-32">
        <div class="card-elegant max-w-md w-full text-center">
          <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
          <h3 class="text-lg font-semibold mt-4 mb-2">您已参加过此考试</h3>
          <p class="mb-6" style="color: var(--color-text-secondary)">此考试不允许重复参加</p>
          <el-button @click="$router.push('/student/dashboard')">返回学生中心</el-button>
        </div>
      </div>

      <!-- No Exam Selected -->
      <div v-else-if="!examId" class="flex items-center justify-center py-32">
        <div class="card-elegant max-w-md w-full text-center">
          <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
          <h3 class="text-lg font-semibold mt-4 mb-2">演示模式</h3>
          <p class="mb-6" style="color: var(--color-text-secondary)">
            当前为演示考试，包含示例题目
          </p>
          <el-button type="primary" @click="startDemoExam">开始演示</el-button>
        </div>
      </div>

      <!-- Exam loaded but no questions -->
      <div v-else-if="examId && questions.length === 0" class="flex items-center justify-center py-32">
        <div class="card-elegant max-w-md w-full text-center">
          <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
          <h3 class="text-lg font-semibold mt-4 mb-2">该考试暂无题目</h3>
          <p class="mb-6" style="color: var(--color-text-secondary)">此考试尚未添加题目，请联系教师</p>
          <el-button @click="$router.push('/student/dashboard')">返回学生中心</el-button>
        </div>
      </div>

      <!-- Exam Content -->
      <div v-else-if="questions.length > 0" class="container py-8">
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <!-- Main Content -->
          <div class="lg:col-span-3">
            <div class="card-elegant">
              <div class="mb-8">
                <div class="flex items-center justify-between mb-4">
                  <h2 class="text-xl font-bold">
                    第 {{ currentQuestion + 1 }} 题 / 共 {{ questions.length }} 题
                  </h2>
                  <el-tag effect="plain">{{ Number(questions[currentQuestion].examPoints) }} 分</el-tag>
                </div>

                <p class="text-lg mb-6 leading-relaxed">{{ questions[currentQuestion].title }}</p>

                <!-- Single Choice -->
                <div v-if="questions[currentQuestion].type === 'single'" class="space-y-3">
                  <el-radio-group
                    :model-value="answers[questions[currentQuestion].id]"
                    @update:model-value="setAnswer(questions[currentQuestion].id, $event)"
                  >
                    <div
                      v-for="(text, key) in (questions[currentQuestion].options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all mb-3"
                      :style="{
                        borderColor: answers[questions[currentQuestion].id] === key ? '#f9a8d4' : 'var(--color-border)',
                        background: answers[questions[currentQuestion].id] === key ? 'rgba(249,168,212,0.05)' : 'transparent',
                      }"
                    >
                      <el-radio :value="key">
                        <span class="font-medium">{{ key }}.</span>
                        <span class="ml-2">{{ text }}</span>
                      </el-radio>
                    </div>
                  </el-radio-group>
                </div>

                <!-- Multiple Choice -->
                <div v-else-if="questions[currentQuestion].type === 'multiple'" class="space-y-3">
                  <el-checkbox-group
                    :model-value="currentMultipleAnswers"
                    @update:model-value="setMultipleAnswers(questions[currentQuestion].id, $event)"
                  >
                    <div
                      v-for="(text, key) in (questions[currentQuestion].options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all mb-3"
                      :style="{
                        borderColor: currentMultipleAnswers.includes(String(key)) ? '#f9a8d4' : 'var(--color-border)',
                        background: currentMultipleAnswers.includes(String(key)) ? 'rgba(249,168,212,0.05)' : 'transparent',
                      }"
                    >
                      <el-checkbox :value="key">
                        <span class="font-medium">{{ key }}.</span>
                        <span class="ml-2">{{ text }}</span>
                      </el-checkbox>
                    </div>
                  </el-checkbox-group>
                </div>

                <!-- True/False -->
                <div v-else-if="questions[currentQuestion].type === 'trueFalse'" class="space-y-3">
                  <el-radio-group
                    :model-value="answers[questions[currentQuestion].id]"
                    @update:model-value="setAnswer(questions[currentQuestion].id, $event)"
                  >
                    <div
                      v-for="(text, key) in (questions[currentQuestion].options || {})"
                      :key="key"
                      class="flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all mb-3"
                      :style="{
                        borderColor: answers[questions[currentQuestion].id] === key ? '#f9a8d4' : 'var(--color-border)',
                        background: answers[questions[currentQuestion].id] === key ? 'rgba(249,168,212,0.05)' : 'transparent',
                      }"
                    >
                      <el-radio :value="key">
                        <span class="font-medium">{{ key }}.</span>
                        <span class="ml-2">{{ text }}</span>
                      </el-radio>
                    </div>
                  </el-radio-group>
                </div>

                <!-- Fill Blank -->
                <div v-else-if="questions[currentQuestion].type === 'fillBlank'">
                  <el-input
                    v-model="answers[questions[currentQuestion].id]"
                    placeholder="请输入答案..."
                    size="large"
                  />
                </div>

                <!-- Essay -->
                <div v-else-if="questions[currentQuestion].type === 'essay'">
                  <el-input
                    v-model="answers[questions[currentQuestion].id]"
                    type="textarea"
                    :rows="8"
                    placeholder="请输入你的回答..."
                  />
                </div>
              </div>

              <!-- Navigation -->
              <div class="flex gap-3 justify-between pt-6" style="border-top: 1px solid var(--color-border)">
                <el-button
                  :disabled="currentQuestion === 0"
                  @click="currentQuestion--"
                >
                  上一题
                </el-button>
                <div class="flex gap-2">
                  <el-button
                    v-if="currentQuestion < questions.length - 1"
                    @click="currentQuestion++"
                  >
                    下一题
                  </el-button>
                  <el-button
                    v-if="currentQuestion === questions.length - 1"
                    type="primary"
                    @click="handleSubmit"
                  >
                    提交答卷
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div class="lg:col-span-1">
            <div class="card-elegant sticky top-24">
              <h3 class="font-bold mb-4">答题进度</h3>

              <el-alert
                v-if="switchCount > 0"
                :title="`已切屏 ${switchCount} / ${MAX_SWITCHES} 次`"
                :type="switchCount >= MAX_SWITCHES - 1 ? 'error' : 'warning'"
                :closable="false"
                class="mb-4"
              />

              <el-alert
                v-if="isTimeWarning"
                title="时间即将结束，请尽快提交答卷"
                type="warning"
                :closable="false"
                class="mb-4"
              />

              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="(_, idx) in questions"
                  :key="idx"
                  class="aspect-square rounded-lg font-medium transition-all text-sm"
                  :style="{
                    background: idx === currentQuestion
                      ? '#f9a8d4'
                      : answers[questions[idx].id]
                        ? 'rgba(249,168,212,0.15)'
                        : 'var(--color-muted)',
                    color: idx === currentQuestion
                      ? 'white'
                      : answers[questions[idx].id]
                        ? '#f9a8d4'
                        : 'var(--color-text-secondary)',
                  }"
                  @click="currentQuestion = idx"
                >
                  {{ idx + 1 }}
                </button>
              </div>

              <div class="mt-4 pt-4 space-y-2 text-sm" style="border-top: 1px solid var(--color-border)">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded" style="background: rgba(249,168,212,0.15)"></div>
                  <span>已答题</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded" style="background: var(--color-muted)"></div>
                  <span>未答题</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Clock, Loading, Notebook } from "@element-plus/icons-vue";
import { studentExamsApi } from "../api";
import type { Question, Exam } from "../types";

const route = useRoute();
const router = useRouter();

const examId = computed(() => {
  const id = route.query.examId;
  return id ? Number(id) : null;
});

const examInfo = ref<Exam | null>(null);
const questions = ref<(Question & { order: number; examPoints: string })[]>([]);
const loading = ref(false);
const currentQuestion = ref(0);
const answers = ref<Record<number, string>>({});
const submitted = ref(false);
const timeLeft = ref(3600);
const startTime = ref("");
const timer = ref<ReturnType<typeof setInterval> | null>(null);
const forbidden = ref(false);

const submitResult = ref({ score: 0, totalPoints: 0, passingScore: 60, hasEssay: false });

const isTimeWarning = computed(() => timeLeft.value < 300);

// Anti-cheat: tab switch detection
const switchCount = ref(0);
const MAX_SWITCHES = 3;
const isExamActive = computed(() => !submitted.value && questions.value.length > 0);

const handleVisibilityChange = () => {
  if (!isExamActive.value) return;
  if (document.hidden) {
    onTabSwitch();
  }
};

const handleBlur = () => {
  if (!isExamActive.value) return;
  onTabSwitch();
};

let lastSwitchTime = 0;
const onTabSwitch = () => {
  const now = Date.now();
  if (now - lastSwitchTime < 1000) return;
  lastSwitchTime = now;

  switchCount.value++;
  const remaining = MAX_SWITCHES - switchCount.value;

  if (remaining <= 0) {
    ElMessage.error("切屏次数已达上限，系统将自动提交试卷");
    submitExam();
  } else {
    ElMessage.warning(`检测到切屏！已切屏 ${switchCount.value} 次，剩余 ${remaining} 次，超过 ${MAX_SWITCHES} 次将自动提交`);
  }
};

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const setAnswer = (questionId: number, value: string) => {
  answers.value[questionId] = value;
};

const currentMultipleAnswers = computed(() => {
  if (!questions.value.length) return [];
  const qId = questions.value[currentQuestion.value]?.id;
  const raw = answers.value[qId] || "";
  return raw ? raw.split(",").filter(Boolean) : [];
});

const setMultipleAnswers = (questionId: number, values: string[]) => {
  answers.value[questionId] = values.sort().join(",");
};

const startTimer = (durationMinutes: number) => {
  timeLeft.value = durationMinutes * 60;
  timer.value = setInterval(() => {
    timeLeft.value--;
    if (timeLeft.value <= 0) {
      if (timer.value) clearInterval(timer.value);
      submitExam();
    }
  }, 1000);
};

const loadExam = async () => {
  if (!examId.value) return;
  loading.value = true;
  try {
    const data = await studentExamsApi.getExam(examId.value);
    console.log("[DEBUG] loadExam response:", data);
    console.log("[DEBUG] questions count:", data.questions?.length);
    examInfo.value = data.exam;
    questions.value = data.questions;

    if (!data.exam.allowRetake) {
      try {
        await ElMessageBox.confirm(
          "教师设置不允许重复考试，提交后将无法再次参加。确定开始考试吗？",
          "提示",
          { confirmButtonText: "确定", cancelButtonText: "取消", type: "warning" }
        );
      } catch {
        router.push("/student/dashboard");
        return;
      }
    }

    startTime.value = new Date().toISOString();
    startTimer(data.exam.duration);
  } catch (err: any) {
    if (err?.response?.status === 403) {
      forbidden.value = true;
    } else {
      ElMessage.error("加载考试失败");
    }
  } finally {
    loading.value = false;
  }
};

const startDemoExam = () => {
  questions.value = [
    {
      id: 1, type: "single", title: "什么是在线考试系统？",
      options: { A: "一个用于组织线上考试的平台", B: "一个社交媒体应用", C: "一个文件存储服务", D: "一个视频播放器" },
      correctAnswer: "A", explanation: null, difficulty: "easy", category: null, points: "5",
      createdBy: 0, createdAt: "", updatedAt: "", order: 1, examPoints: "5", gradingRubric: null,
    },
    {
      id: 2, type: "multiple", title: "以下哪些是在线考试系统的功能？（多选）",
      options: { A: "题库管理", B: "试卷发布", C: "成绩查看", D: "视频编辑" },
      correctAnswer: "A,B,C", explanation: null, difficulty: "medium", category: null, points: "10",
      createdBy: 0, createdAt: "", updatedAt: "", order: 2, examPoints: "10", gradingRubric: null,
    },
    {
      id: 3, type: "trueFalse", title: "在线考试系统可以帮助教师节省时间。",
      options: { A: "正确", B: "错误" }, correctAnswer: "A", explanation: null, difficulty: "easy", category: null, points: "5",
      createdBy: 0, createdAt: "", updatedAt: "", order: 3, examPoints: "5", gradingRubric: null,
    },
  ];
  startTime.value = new Date().toISOString();
  startTimer(60);
};

const submitExam = async () => {
  if (timer.value) clearInterval(timer.value);

  // If we have a real exam, submit to server
  if (examId.value && examId.value < 1_000_000_000) {
    try {
      const result = await studentExamsApi.submit(examId.value, {
        answers: answers.value,
        startTime: startTime.value,
      });
      submitResult.value = {
        score: result.score,
        totalPoints: result.totalPoints,
        passingScore: Number(examInfo.value?.passingScore ?? 60),
        hasEssay: result.hasEssay,
      };
    } catch {
      // Fall through to demo scoring
      demoScore();
    }
  } else {
    demoScore();
  }

  submitted.value = true;
};

const demoScore = () => {
  let score = 0;
  questions.value.forEach((q) => {
    if (answers.value[q.id]) score += Number(q.points);
  });
  const total = questions.value.reduce((s, q) => s + Number(q.points), 0);
  submitResult.value = { score, totalPoints: total, passingScore: 60 };
};

const handleSubmit = async () => {
  try {
    await ElMessageBox.confirm("确定要提交答卷吗？提交后不可修改。", "确认提交", {
      confirmButtonText: "提交",
      cancelButtonText: "继续答题",
      type: "warning",
    });
    submitExam();
  } catch {
    // cancelled
  }
};

onMounted(() => {
  if (examId.value) {
    loadExam();
  }
  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("blur", handleBlur);
});

onUnmounted(() => {
  if (timer.value) clearInterval(timer.value);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
  window.removeEventListener("blur", handleBlur);
});
</script>
