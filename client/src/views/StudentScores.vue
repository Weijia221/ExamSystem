<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <el-button text @click="$router.push('/student/dashboard')">
            <el-icon class="mr-1"><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="text-lg font-bold gradient-text">我的成绩</h1>
        </div>
      </div>
    </header>

    <div class="container py-8">
      <!-- Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div v-for="stat in statistics" :key="stat.label" class="card-elegant">
          <p class="text-sm mb-1" style="color: var(--color-text-secondary)">{{ stat.label }}</p>
          <p class="text-3xl font-bold">{{ stat.value }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card-elegant text-center py-12">
        <el-icon class="is-loading" :size="32" style="color: #ec4899"><Loading /></el-icon>
        <p class="mt-4" style="color: var(--color-text-secondary)">正在加载成绩数据...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="scores.length === 0" class="card-elegant text-center py-12">
        <el-icon :size="48" style="color: var(--color-border)"><DataAnalysis /></el-icon>
        <p class="mt-4 mb-4" style="color: var(--color-text-secondary)">暂无考试成绩</p>
        <el-button
          type="primary"
          style="background: linear-gradient(135deg, #ec4899, #db2777); border: none"
          @click="$router.push('/student/dashboard')"
        >
          返回学生中心
        </el-button>
      </div>

      <!-- Scores List -->
      <div v-else class="space-y-4">
        <div
          v-for="score in scores"
          :key="score.id"
          class="card-elegant hover:shadow-md transition-shadow cursor-pointer"
          @click="selectedScore = score"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1">
              <h3 class="text-lg font-bold mb-2">{{ score.examTitle }}</h3>
              <div class="flex items-center gap-6 text-sm" style="color: var(--color-text-secondary)">
                <span>
                  <el-icon class="mr-1"><Clock /></el-icon>
                  提交时间: {{ score.submittedAt }}
                </span>
                <span>用时: {{ score.duration }} 分钟</span>
              </div>
            </div>
            <div class="text-right">
              <template v-if="score.status === 'pending'">
                <div class="text-lg font-bold mb-1" style="color: #f59e0b">
                  待批阅
                </div>
                <el-tag type="warning" effect="plain">
                  等待教师批阅
                </el-tag>
              </template>
              <template v-else>
                <div class="text-3xl font-bold mb-1" :style="{ color: score.status === 'passed' ? '#22c55e' : '#ef4444' }">
                  {{ score.score }}
                </div>
                <div class="text-sm mb-3" style="color: var(--color-text-secondary)">
                  / {{ score.totalPoints }}
                </div>
                <el-tag :type="score.status === 'passed' ? 'success' : 'danger'" effect="plain">
                  {{ score.status === "passed" ? "及格" : "未及格" }}
                </el-tag>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Detail Dialog -->
      <el-dialog
        v-model="showDetail"
        :title="selectedScore?.examTitle + ' — 成绩详情'"
        width="680px"
        destroy-on-close
      >
        <div v-if="detailLoading" class="text-center py-8">
          <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
        </div>
        <div v-else-if="detailData" class="space-y-4">
          <!-- 待批阅状态 -->
          <div v-if="detailData.status === 'submitted'" class="p-4 rounded-xl text-center" style="background: rgba(245,158,11,0.05); border: 1px solid rgba(245,158,11,0.2)">
            <p class="text-lg font-bold" style="color: #f59e0b">⏳ 等待教师批阅</p>
            <p class="text-sm mt-1" style="color: var(--color-text-secondary)">试卷中包含问答题，教师批阅后将公布成绩</p>
          </div>
          <!-- 已批改 -->
          <div v-else class="flex justify-between items-center p-4 rounded-xl" style="background: var(--color-muted)">
            <span class="text-sm" style="color: var(--color-text-secondary)">总分</span>
            <span class="text-2xl font-bold" :style="{ color: detailData.score >= detailData.passingScore ? '#22c55e' : '#ef4444' }">
              {{ detailData.score }} / {{ detailData.totalPoints }}
            </span>
          </div>
          <div class="space-y-3">
            <div
              v-for="(q, idx) in detailData.questions"
              :key="q.questionId"
              class="p-4 rounded-xl border"
              :style="{
                borderColor: q.type === 'essay' && q.isCorrect === null ? 'rgba(249,168,212,0.3)' : q.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                background: q.type === 'essay' && q.isCorrect === null ? 'rgba(249,168,212,0.03)' : q.isCorrect ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
              }"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold" style="color: #f9a8d4">{{ idx + 1 }}</span>
                  <el-tag size="small" effect="plain">{{ getTypeLabel(q.type) }}</el-tag>
                </div>
                <span class="text-sm font-medium" :style="{ color: q.type === 'essay' && q.isCorrect === null ? '#f9a8d4' : q.isCorrect ? '#22c55e' : '#ef4444' }">
                  {{ q.earnedPoints }} / {{ q.totalPoints }} 分
                </span>
              </div>
              <p class="text-sm font-medium mb-2">{{ q.title }}</p>
              <div v-if="q.type === 'essay'" class="space-y-2 mb-2">
                <div class="p-3 rounded-lg text-xs" style="background: rgba(249,168,212,0.05)">
                  <p class="font-medium mb-1" style="color: var(--color-text-secondary)">我的答案：</p>
                  <p class="whitespace-pre-wrap">{{ q.studentAnswer || '未作答' }}</p>
                </div>
                <div class="p-3 rounded-lg text-xs" style="background: rgba(34,197,94,0.05)">
                  <p class="font-medium mb-1" style="color: var(--color-text-secondary)">参考答案：</p>
                  <p class="whitespace-pre-wrap">{{ q.correctAnswer }}</p>
                </div>
                <div v-if="q.aiComment" class="p-3 rounded-lg text-xs" style="background: rgba(168,85,247,0.05)">
                  <p class="font-medium mb-1" style="color: #a855f7">🤖 AI 评语：</p>
                  <p>{{ q.aiComment }}</p>
                </div>
              </div>
              <div v-else class="text-xs space-y-1" style="color: var(--color-text-secondary)">
                <p>我的答案: <span :class="q.isCorrect ? 'text-green-600' : 'text-red-600'">{{ formatAnswer(q.studentAnswer, q.options, q.type) || '未作答' }}</span></p>
                <p>正确答案: <span class="text-green-600">{{ formatAnswer(q.correctAnswer, q.options, q.type) }}</span></p>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button type="primary" @click="showDetail = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { ArrowLeft, Loading, DataAnalysis, Clock } from "@element-plus/icons-vue";
import { scoresApi, type ScoreDetail } from "../api";
import type { StudentScore } from "../types";

const scores = ref<StudentScore[]>([]);
const loading = ref(true);
const selectedScore = ref<StudentScore | null>(null);
const detailData = ref<ScoreDetail | null>(null);
const detailLoading = ref(false);

const showDetail = computed({
  get: () => !!selectedScore.value,
  set: (val) => { if (!val) { selectedScore.value = null; detailData.value = null; } },
});

watch(selectedScore, async (score) => {
  if (score) {
    detailLoading.value = true;
    detailData.value = null;
    try {
      detailData.value = await scoresApi.detail(score.id);
    } catch {
      detailData.value = null;
    } finally {
      detailLoading.value = false;
    }
  }
});

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题", essay: "问答题",
};
const getTypeLabel = (t: string) => typeLabels[t] ?? t;

const formatAnswer = (answer: string, options: Record<string, string> | null, type: string) => {
  if (!answer) return "";
  if (options && (type === "single" || type === "trueFalse" || type === "multiple")) {
    if (type === "multiple") {
      return answer.split(",").filter(Boolean).map((k) => `${k}.${options[k] ?? ""}`).join("、");
    }
    return `${answer}.${options[answer] ?? ""}`;
  }
  return answer;
};

const statistics = computed(() => {
  const data = scores.value;
  const graded = data.filter((r) => r.status !== "pending");
  const pending = data.filter((r) => r.status === "pending");
  return [
    { label: "考试总数", value: data.length },
    { label: "待批阅", value: pending.length },
    {
      label: "平均分",
      value: graded.length > 0 ? Math.round(graded.reduce((s, r) => s + r.score, 0) / graded.length) : 0,
    },
    { label: "及格数", value: graded.filter((r) => r.status === "passed").length },
  ];
});

onMounted(async () => {
  loading.value = true;
  try {
    scores.value = await scoresApi.student();
  } catch {
    scores.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
