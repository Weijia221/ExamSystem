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
            <template #default>
              <el-button size="small" type="primary" text>查看详情</el-button>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ArrowLeft, Loading, DataAnalysis, Download } from "@element-plus/icons-vue";
import { scoresApi } from "../api";
import type { TeacherScore } from "../types";

const scores = ref<TeacherScore[]>([]);
const loading = ref(true);
const selectedExam = ref("");

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
