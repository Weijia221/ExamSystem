<template>
  <div class="min-h-screen" style="background: var(--color-background)">
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
      <!-- Exam List -->
      <template v-if="!selectedExam">
        <div class="mb-6">
          <h2 class="text-2xl font-bold">成绩管理</h2>
          <p class="mt-1" style="color: var(--color-text-secondary)">选择考试查看学生成绩</p>
        </div>

        <div v-if="loading" class="card-elegant text-center py-12">
          <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
        </div>

        <div v-else-if="examList.length === 0" class="card-elegant text-center py-12">
          <el-icon :size="48" style="color: var(--color-border)"><DataAnalysis /></el-icon>
          <p class="mt-4" style="color: var(--color-text-secondary)">暂无考试记录</p>
        </div>

        <div v-else class="card-elegant overflow-hidden" style="padding: 0">
          <el-table :data="examList" style="width: 100%">
            <el-table-column label="考试名称" prop="examTitle" min-width="200" show-overflow-tooltip />
            <el-table-column label="参考人数" width="100">
              <template #default="{ row }">{{ row.count }} 人</template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" type="primary" text @click="selectedExam = row.examTitle">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

      <!-- Student Records for Selected Exam -->
      <template v-else>
        <div class="mb-6">
          <el-button text class="mb-2" @click="selectedExam = ''">
            <el-icon class="mr-1"><ArrowLeft /></el-icon>返回
          </el-button>
          <h2 class="text-2xl font-bold">{{ selectedExam }}</h2>
          <p class="mt-1" style="color: var(--color-text-secondary)">共 {{ selectedExamScores.length }} 条成绩记录</p>
        </div>

        <div class="card-elegant overflow-hidden" style="padding: 0">
          <el-table :data="selectedExamScores" style="width: 100%">
            <el-table-column label="学生" prop="studentName" width="120" show-overflow-tooltip />
            <el-table-column label="得分" width="140">
              <template #default="{ row }">
                <span :style="{ color: row.score >= (row.totalPoints * 0.6) ? '#10b981' : '#ef4444', fontWeight: 600 }">
                  {{ row.score }}
                </span>
                <span style="color: var(--color-text-secondary)"> / {{ row.totalPoints }}</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'graded' ? 'success' : 'warning'"
                  effect="plain"
                  size="small"
                >
                  {{ row.status === "graded" ? "已批改" : "已提交" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="提交时间" min-width="150">
              <template #default="{ row }">{{ row.submittedAt }}</template>
            </el-table-column>
            <el-table-column label="考试时长" width="100">
              <template #default="{ row }">{{ row.duration != null ? row.duration + ' 分钟' : '-' }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" type="primary" text @click="viewDetail(row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </template>

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
import { ArrowLeft, Loading, DataAnalysis } from "@element-plus/icons-vue";
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

const examList = computed(() => {
  const map = new Map<string, Set<number>>();
  for (const s of scores.value) {
    if (!map.has(s.examTitle)) map.set(s.examTitle, new Set());
    map.get(s.examTitle)!.add(s.studentId);
  }
  return Array.from(map.entries()).map(([examTitle, students]) => ({ examTitle, count: students.size }));
});

const selectedExamScores = computed(() =>
  scores.value.filter((s) => s.examTitle === selectedExam.value)
);

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
