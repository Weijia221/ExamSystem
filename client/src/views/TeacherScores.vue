<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <div class="flex items-center gap-3">
          <el-button text @click="$router.push('/teacher/dashboard')">
            <el-icon class="mr-1"><ArrowLeft /></el-icon>
            返回
          </el-button>
          <h1 class="text-lg font-bold gradient-text">查看分数</h1>
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

      <!-- Filters -->
      <div class="card-elegant mb-8">
        <h3 class="font-bold mb-4">筛选条件</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium mb-2 block">选择考试</label>
            <el-select v-model="selectedExam" clearable placeholder="全部考试" class="w-full">
              <el-option
                v-for="exam in examNames"
                :key="exam"
                :label="exam"
                :value="exam"
              />
            </el-select>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="card-elegant text-center py-12">
        <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
        <p class="mt-4" style="color: var(--color-text-secondary)">正在加载成绩数据...</p>
      </div>

      <!-- Empty -->
      <div v-else-if="scores.length === 0" class="card-elegant text-center py-12">
        <el-icon :size="48" style="color: var(--color-border)"><DataAnalysis /></el-icon>
        <p class="mt-4" style="color: var(--color-text-secondary)">暂无成绩数据</p>
      </div>

      <!-- Scores Table -->
      <div v-else class="card-elegant overflow-hidden" style="padding: 0">
        <el-table :data="filteredScores" style="width: 100%">
          <el-table-column label="考试名称" prop="examTitle" />
          <el-table-column label="成绩" width="150">
            <template #default="{ row }">
              <span
                class="font-bold"
                :style="{
                  color: row.score >= 80 ? '#22c55e' : row.score >= 60 ? '#f59e0b' : '#ef4444',
                }"
              >
                {{ row.score }}/{{ row.totalPoints }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="提交时间" prop="submittedAt" width="200" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" type="primary" text @click="viewDetail(row.id)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- Export -->
      <div class="mt-6 flex justify-end">
        <el-button type="primary">
          <el-icon class="mr-1"><Download /></el-icon>
          导出成绩
        </el-button>
      </div>

      <!-- Detail Dialog -->
      <el-dialog
        v-model="showDetail"
        :title="detailData?.examTitle + ' — 成绩详情'"
        width="680px"
        destroy-on-close
      >
        <div v-if="detailLoading" class="text-center py-8">
          <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
        </div>
        <div v-else-if="detailData" class="space-y-4">
          <div class="flex justify-between items-center p-4 rounded-xl" style="background: var(--color-muted)">
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
                borderColor: q.isCorrect ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
                background: q.isCorrect ? 'rgba(34,197,94,0.03)' : 'rgba(239,68,68,0.03)',
              }"
            >
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-semibold" style="color: #f9a8d4">{{ idx + 1 }}</span>
                  <el-tag size="small" effect="plain">{{ getTypeLabel(q.type) }}</el-tag>
                </div>
                <span class="text-sm font-medium" :style="{ color: q.isCorrect ? '#22c55e' : '#ef4444' }">
                  {{ q.earnedPoints }} / {{ q.totalPoints }} 分
                </span>
              </div>
              <p class="text-sm font-medium mb-2">{{ q.title }}</p>
              <div class="text-xs space-y-1" style="color: var(--color-text-secondary)">
                <p>学生答案: <span :class="q.isCorrect ? 'text-green-600' : 'text-red-600'">{{ formatAnswer(q.studentAnswer, q.options, q.type) || '未作答' }}</span></p>
                <p>正确答案: <span class="text-green-600">{{ formatAnswer(q.correctAnswer, q.options, q.type) }}</span></p>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <el-button @click="showDetail = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ArrowLeft, Loading, DataAnalysis, Download } from "@element-plus/icons-vue";
import { scoresApi, type ScoreDetail } from "../api";
import type { TeacherScore } from "../types";

const scores = ref<TeacherScore[]>([]);
const loading = ref(true);
const selectedExam = ref("");
const detailData = ref<ScoreDetail | null>(null);
const detailLoading = ref(false);

const showDetail = computed({
  get: () => !!detailData.value,
  set: (val) => { if (!val) detailData.value = null; },
});

const examNames = computed(() => [...new Set(scores.value.map((s) => s.examTitle))]);

const filteredScores = computed(() =>
  scores.value.filter((s) => {
    if (selectedExam.value && s.examTitle !== selectedExam.value) return false;
    return true;
  })
);

const statistics = computed(() => {
  const data = filteredScores.value;
  return [
    { label: "考试总数", value: examNames.value.length },
    { label: "记录数", value: data.length },
    {
      label: "平均分",
      value: data.length > 0 ? Math.round(data.reduce((s, r) => s + r.score, 0) / data.length) : 0,
    },
    {
      label: "及格率",
      value: data.length > 0 ? Math.round((data.filter((r) => r.score >= 60).length / data.length) * 100) + "%" : "0%",
    },
  ];
});

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题",
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

const viewDetail = async (recordId: number) => {
  detailLoading.value = true;
  detailData.value = null;
  try {
    detailData.value = await scoresApi.detail(recordId);
  } catch {
    detailData.value = null;
  } finally {
    detailLoading.value = false;
  }
};

onMounted(async () => {
  loading.value = true;
  try {
    scores.value = await scoresApi.teacher();
  } catch {
    scores.value = [];
  } finally {
    loading.value = false;
  }
});
</script>
