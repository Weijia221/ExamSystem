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
              <div class="text-3xl font-bold mb-1" :style="{ color: score.status === 'passed' ? '#22c55e' : '#ef4444' }">
                {{ score.score }}
              </div>
              <div class="text-sm mb-3" style="color: var(--color-text-secondary)">
                / {{ score.totalPoints }}
              </div>
              <el-tag :type="score.status === 'passed' ? 'success' : 'danger'" effect="plain">
                {{ score.status === "passed" ? "及格" : "未及格" }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- Score Detail Dialog -->
      <el-dialog
        v-model="showDetail"
        :title="selectedScore?.examTitle"
        width="420px"
        destroy-on-close
      >
        <div v-if="selectedScore" class="space-y-4">
          <div class="flex justify-between text-sm">
            <span style="color: var(--color-text-secondary)">成绩</span>
            <span class="font-bold text-lg">{{ selectedScore.score }}/{{ selectedScore.totalPoints }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span style="color: var(--color-text-secondary)">状态</span>
            <el-tag :type="selectedScore.status === 'passed' ? 'success' : 'danger'" size="small">
              {{ selectedScore.status === "passed" ? "及格" : "未及格" }}
            </el-tag>
          </div>
          <div class="flex justify-between text-sm">
            <span style="color: var(--color-text-secondary)">用时</span>
            <span class="font-medium">{{ selectedScore.duration }} 分钟</span>
          </div>
          <div class="flex justify-between text-sm">
            <span style="color: var(--color-text-secondary)">提交时间</span>
            <span class="font-medium">{{ selectedScore.submittedAt }}</span>
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
import { scoresApi } from "../api";
import type { StudentScore } from "../types";

const scores = ref<StudentScore[]>([]);
const loading = ref(true);
const selectedScore = ref<StudentScore | null>(null);

const showDetail = computed({
  get: () => !!selectedScore.value,
  set: (val) => { if (!val) selectedScore.value = null; },
});

const statistics = computed(() => {
  const data = scores.value;
  return [
    { label: "考试总数", value: data.length },
    {
      label: "平均分",
      value: data.length > 0 ? Math.round(data.reduce((s, r) => s + r.score, 0) / data.length) : 0,
    },
    { label: "及格数", value: data.filter((r) => r.status === "passed").length },
    {
      label: "及格率",
      value: data.length > 0
        ? Math.round((data.filter((r) => r.status === "passed").length / data.length) * 100) + "%"
        : "0%",
    },
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
