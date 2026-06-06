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
            <el-table-column label="待批阅" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.pending > 0" type="warning" effect="plain" size="small">
                  {{ row.pending }} 人
                </el-tag>
                <span v-else style="color: var(--color-text-secondary)">-</span>
              </template>
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
                <template v-if="row.status === 'submitted'">
                  <span style="color: #f59e0b; font-weight: 600">待批改</span>
                </template>
                <template v-else>
                  <span :style="{ color: row.score >= (row.totalPoints * 0.6) ? '#10b981' : '#ef4444', fontWeight: 600 }">
                    {{ row.score }}
                  </span>
                  <span style="color: var(--color-text-secondary)"> / {{ row.totalPoints }}</span>
                </template>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === 'graded' ? 'success' : 'warning'"
                  effect="plain"
                  size="small"
                >
                  {{ row.status === "graded" ? "已批改" : "待批改" }}
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
            <div>
              <span class="text-sm" style="color: var(--color-text-secondary)">总分</span>
              <el-tag v-if="detailData.status === 'submitted'" size="small" type="warning" class="ml-2">待批改</el-tag>
              <el-tag v-else size="small" type="success" class="ml-2">已批改</el-tag>
            </div>
            <span class="text-2xl font-bold" :style="{ color: detailData.score >= detailData.passingScore ? '#22c55e' : '#ef4444' }">
              {{ detailData.score }} / {{ detailData.totalPoints }}
            </span>
          </div>

          <!-- Batch AI Grade Button -->
          <div v-if="detailData.questions.some(q => q.type === 'essay')" class="flex gap-2">
            <el-button
              type="primary"
              size="small"
              :loading="aiGrading"
              @click="batchAiGrade"
            >
              🤖 批量AI评分
            </el-button>
            <el-button
              v-if="detailData.status === 'submitted'"
              type="success"
              size="small"
              @click="confirmAllGrades"
            >
              ✓ 确认所有评分
            </el-button>
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
                <div class="flex items-center gap-2">
                  <!-- Essay: editable points -->
                  <template v-if="q.type === 'essay'">
                    <template v-if="showEditInput[q.questionId]">
                      <el-input-number
                        v-model="editingPoints[q.questionId]"
                        :min="0"
                        :max="q.totalPoints"
                        :step="0.5"
                        size="small"
                        style="width: 100px"
                      />
                      <el-button size="small" type="success" text @click="confirmEditPoints(q.questionId)">确认</el-button>
                      <el-button size="small" text @click="showEditInput[q.questionId] = false">取消</el-button>
                    </template>
                    <template v-else>
                      <span
                        class="text-sm font-medium cursor-pointer hover:underline"
                        style="color: #f9a8d4"
                        @click="startEditPoints(q.questionId, q.earnedPoints)"
                      >
                        {{ q.earnedPoints }} / {{ q.totalPoints }} 分
                      </span>
                    </template>
                  </template>
                  <!-- Non-essay: static points -->
                  <span v-else class="text-sm font-medium" :style="{ color: q.isCorrect ? '#22c55e' : '#ef4444' }">
                    {{ q.earnedPoints }} / {{ q.totalPoints }} 分
                  </span>
                </div>
              </div>
              <p class="text-sm font-medium mb-2">{{ q.title }}</p>

              <!-- Essay specific content -->
              <div v-if="q.type === 'essay'" class="space-y-2 mb-2">
                <div class="p-3 rounded-lg text-xs" style="background: rgba(249,168,212,0.05)">
                  <p class="font-medium mb-1" style="color: var(--color-text-secondary)">学生答案：</p>
                  <p class="whitespace-pre-wrap">{{ q.studentAnswer || '未作答' }}</p>
                </div>
                <div class="p-3 rounded-lg text-xs" style="background: rgba(34,197,94,0.05)">
                  <p class="font-medium mb-1" style="color: var(--color-text-secondary)">参考答案：</p>
                  <p class="whitespace-pre-wrap">{{ q.correctAnswer }}</p>
                </div>
                <div v-if="q.gradingRubric" class="p-3 rounded-lg text-xs" style="background: rgba(59,130,246,0.05)">
                  <p class="font-medium mb-1" style="color: var(--color-text-secondary)">评分标准：</p>
                  <p class="whitespace-pre-wrap">{{ q.gradingRubric }}</p>
                </div>
                <!-- AI Score & Comment -->
                <div v-if="q.aiScore !== null" class="p-3 rounded-lg" style="background: rgba(168,85,247,0.05)">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-medium" style="color: #a855f7">🤖 AI 评分：</span>
                    <span class="text-sm font-bold" style="color: #a855f7">{{ q.aiScore }} 分</span>
                  </div>
                  <p class="text-xs" style="color: var(--color-text-secondary)">{{ q.aiComment }}</p>
                </div>
                <!-- Manual & AI Grade Buttons -->
                <div class="flex gap-2 flex-wrap">
                  <el-button
                    size="small"
                    type="warning"
                    plain
                    @click="startEditPoints(q.questionId, q.earnedPoints)"
                  >
                    ✏️ 手动评分
                  </el-button>
                  <el-button
                    v-if="q.aiScore === null"
                    size="small"
                    type="primary"
                    plain
                    :loading="aiGrading"
                    @click="aiGradeQuestion(q.questionId)"
                  >
                    🤖 AI 评分
                  </el-button>
                  <el-button
                    v-if="q.aiScore !== null"
                    size="small"
                    type="success"
                    @click="confirmEditPoints(q.questionId)"
                  >
                    ✓ 确认评分
                  </el-button>
                </div>
                <!-- Manual grading input -->
                <div v-if="showEditInput[q.questionId]" class="p-3 rounded-lg border" style="border-color: #f59e0b; background: rgba(245,158,11,0.03)">
                  <p class="text-xs font-medium mb-2" style="color: #f59e0b">输入分数（满分 {{ q.totalPoints }} 分）：</p>
                  <div class="flex items-center gap-2">
                    <el-input-number
                      v-model="editingPoints[q.questionId]"
                      :min="0"
                      :max="q.totalPoints"
                      :step="0.5"
                      size="small"
                      style="width: 120px"
                    />
                    <el-button size="small" type="success" @click="confirmEditPoints(q.questionId)">确认</el-button>
                    <el-button size="small" @click="showEditInput[q.questionId] = false">取消</el-button>
                  </div>
                </div>
              </div>

              <!-- Non-essay: standard display -->
              <div v-else class="text-xs space-y-1" style="color: var(--color-text-secondary)">
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
import { ElMessage, ElMessageBox } from "element-plus";
import { scoresApi, teacherApi, type ScoreDetail } from "../api";
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
  const map = new Map<string, { students: Set<number>; pending: number }>();
  for (const s of scores.value) {
    if (!map.has(s.examTitle)) map.set(s.examTitle, { students: new Set(), pending: 0 });
    const entry = map.get(s.examTitle)!;
    entry.students.add(s.studentId);
    if (s.status === "submitted") entry.pending++;
  }
  return Array.from(map.entries()).map(([examTitle, data]) => ({
    examTitle,
    count: data.students.size,
    pending: data.pending,
  }));
});

const selectedExamScores = computed(() =>
  scores.value.filter((s) => s.examTitle === selectedExam.value)
);

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题", essay: "问答题",
};

// AI grading state
const aiGrading = ref(false);
const editingPoints = ref<Record<number, number>>({});
const showEditInput = ref<Record<number, boolean>>({});
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

// AI 评分单个问答题
const aiGradeQuestion = async (questionId: number) => {
  if (!detailData.value) return;
  aiGrading.value = true;
  try {
    const result = await teacherApi.aiGrade(detailData.value.recordId, questionId);
    // 更新本地数据
    const q = detailData.value.questions.find((q) => q.questionId === questionId);
    if (q) {
      q.aiScore = result.aiScore;
      q.aiComment = result.aiComment;
      q.earnedPoints = result.aiScore;
    }
    // 更新总分
    const newTotal = detailData.value.questions.reduce((sum, q) => sum + q.earnedPoints, 0);
    detailData.value.score = Math.round(newTotal * 10) / 10;
    ElMessage.success("AI 评分完成");
  } catch {
    ElMessage.error("AI 评分失败");
  } finally {
    aiGrading.value = false;
  }
};

// 批量 AI 评分
const batchAiGrade = async () => {
  if (!detailData.value) return;
  aiGrading.value = true;
  try {
    const result = await teacherApi.batchAiGrade(detailData.value.recordId);
    // 更新本地数据
    for (const r of result.results) {
      const q = detailData.value.questions.find((q) => q.questionId === r.questionId);
      if (q) {
        q.aiScore = r.aiScore;
        q.aiComment = r.aiComment;
        q.earnedPoints = r.aiScore;
      }
    }
    // 更新总分
    const newTotal = detailData.value.questions.reduce((sum, q) => sum + q.earnedPoints, 0);
    detailData.value.score = Math.round(newTotal * 10) / 10;
    ElMessage.success(`批量评分完成，共评 ${result.graded} 题`);
  } catch {
    ElMessage.error("批量评分失败");
  } finally {
    aiGrading.value = false;
  }
};

// 开始编辑分数
const startEditPoints = (questionId: number, currentPoints: number) => {
  editingPoints.value[questionId] = currentPoints;
  showEditInput.value[questionId] = true;
};

// 确认修改分数
const confirmEditPoints = async (questionId: number) => {
  if (!detailData.value) return;
  const points = editingPoints.value[questionId];
  if (points === undefined || points < 0) {
    ElMessage.warning("请输入有效分数");
    return;
  }

  try {
    const result = await teacherApi.confirmGrade(detailData.value.recordId, questionId, points);
    const q = detailData.value.questions.find((q) => q.questionId === questionId);
    if (q) {
      q.earnedPoints = points;
      q.isCorrect = points > 0;
    }
    detailData.value.score = result.score;
    showEditInput.value[questionId] = false;
    ElMessage.success("分数已更新");
  } catch {
    ElMessage.error("更新失败");
  }
};

// 确认所有评分（将 submitted 改为 graded）
const confirmAllGrades = async () => {
  if (!detailData.value) return;
  try {
    const result = await teacherApi.confirmAll(detailData.value.recordId);
    detailData.value.status = "graded";
    detailData.value.score = result.score;
    ElMessage.success("所有评分已确认");
    // 刷新列表
    scores.value = await scoresApi.teacher();
  } catch {
    ElMessage.error("确认失败");
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
