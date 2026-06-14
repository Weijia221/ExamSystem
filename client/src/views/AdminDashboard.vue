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
          <p class="text-xs" style="color: var(--color-text-secondary)">管理员控制台</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-sm font-medium">{{ authStore.user?.name || "管理员" }}</p>
            <p class="text-xs" style="color: var(--color-text-secondary)">管理员</p>
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
                  ? 'background: linear-gradient(135deg, #f9a8d4, #f472b6); color: white; box-shadow: 0 4px 12px rgba(249,168,212,0.3)'
                  : 'color: var(--color-text); border: 1px solid var(--color-border)'
              "
              @click="activeTab = item.id"
            >
              <p class="font-medium text-sm">{{ item.label }}</p>
              <p class="text-xs mt-0.5" :style="{ opacity: activeTab === item.id ? 0.7 : 0.6 }">
                {{ item.description }}
              </p>
            </button>
          </nav>
        </aside>

        <!-- Main Content -->
        <main class="lg:col-span-3">
          <!-- Overview Tab -->
          <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in">
            <div>
              <h2 class="text-3xl font-bold">系统概览</h2>
              <p class="mt-1" style="color: var(--color-text-secondary)">查看系统整体运行状况</p>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="card-elegant text-center py-6">
                <p class="text-3xl font-bold" style="color: #f9a8d4">{{ stats.users }}</p>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">用户总数</p>
              </div>
              <div class="card-elegant text-center py-6">
                <p class="text-3xl font-bold" style="color: #ec4899">{{ stats.questions }}</p>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">题目总数</p>
              </div>
              <div class="card-elegant text-center py-6">
                <p class="text-3xl font-bold" style="color: #f472b6">{{ stats.exams }}</p>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">试卷总数</p>
              </div>
              <div class="card-elegant text-center py-6">
                <p class="text-3xl font-bold" style="color: #db2777">{{ stats.records }}</p>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">考试记录</p>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="card-elegant">
              <h3 class="font-bold mb-4">快捷操作</h3>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                <el-button @click="$router.push('/question-bank')">管理题库</el-button>
                <el-button @click="$router.push('/exam-creation')">创建试卷</el-button>
                <el-button @click="$router.push('/teacher/scores')">查看成绩</el-button>
              </div>
            </div>
          </div>

          <!-- Users Tab -->
          <div v-if="activeTab === 'users'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">用户管理</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">查看系统中所有用户</p>
              </div>
              <el-button @click="initAccounts" :loading="initLoading">初始化测试账号</el-button>
            </div>

            <div v-if="userLoading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
            </div>

            <div v-else class="card-elegant overflow-hidden" style="padding: 0">
              <el-table :data="users" style="width: 100%">
                <el-table-column label="ID" prop="id" width="80" />
                <el-table-column label="用户名">
                  <template #default="{ row }">
                    {{ row.name || "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="邮箱" prop="email" />
                <el-table-column label="角色" width="120">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.role === 'admin' ? 'danger' : row.role === 'teacher' ? 'warning' : 'success'"
                      effect="plain"
                    >
                      {{ row.role === "admin" ? "管理员" : row.role === "teacher" ? "教师" : "学生" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="注册时间" width="200">
                  <template #default="{ row }">
                    {{ row.createdAt ? new Date(row.createdAt).toLocaleString("zh-CN") : "-" }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- Questions Tab -->
          <div v-if="activeTab === 'questions'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">题库管理</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">管理系统中所有题目 (共 {{ questions.length }} 道)</p>
              </div>
              <el-button type="primary" @click="$router.push('/question-bank')">
                新增题目
              </el-button>
            </div>

            <div v-if="questionLoading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
            </div>

            <div v-else-if="questions.length === 0" class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Document /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">暂无题目</p>
            </div>

            <div v-else class="card-elegant overflow-hidden" style="padding: 0">
              <el-table :data="questions" style="width: 100%">
                <el-table-column label="ID" prop="id" width="70" />
                <el-table-column label="题目" prop="title" min-width="250" show-overflow-tooltip />
                <el-table-column label="类型" width="100">
                  <template #default="{ row }">
                    <el-tag effect="plain" size="small">
                      {{ row.type === "single" ? "单选" : row.type === "multiple" ? "多选" : row.type === "trueFalse" ? "判断" : "填空" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="难度" width="90">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.difficulty === 'easy' ? 'success' : row.difficulty === 'hard' ? 'danger' : 'warning'"
                      effect="plain"
                      size="small"
                    >
                      {{ row.difficulty === "easy" ? "简单" : row.difficulty === "medium" ? "中等" : "困难" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="分类" width="120">
                  <template #default="{ row }">
                    {{ row.category || "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button size="small" type="danger" text @click="handleDeleteQuestion(row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- Exams Tab -->
          <div v-if="activeTab === 'exams'" class="space-y-6 animate-fade-in">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-3xl font-bold">试卷管理</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">管理系统中所有试卷 (共 {{ exams.length }} 套)</p>
              </div>
              <el-button type="primary" @click="$router.push('/exam-creation')">
                创建试卷
              </el-button>
            </div>

            <div v-if="examLoading" class="card-elegant text-center py-12">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
            </div>

            <div v-else-if="exams.length === 0" class="card-elegant text-center py-12">
              <el-icon :size="48" style="color: var(--color-border)"><Notebook /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">暂无试卷</p>
            </div>

            <div v-else class="card-elegant overflow-hidden" style="padding: 0">
              <el-table :data="exams" style="width: 100%">
                <el-table-column label="试卷名称" prop="title" min-width="120" show-overflow-tooltip />
                <el-table-column label="分数" width="120">
                  <template #default="{ row }">
                    {{ Number(row.totalPoints) }} 分 / {{ row.passingScore ? Number(row.passingScore) + " 及格" : "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="时长" width="80">
                  <template #default="{ row }">
                    {{ row.duration }} 分钟
                  </template>
                </el-table-column>
                <el-table-column label="状态" width="80">
                  <template #default="{ row }">
                    <el-tag
                      :type="row.status === 'published' ? 'success' : row.status === 'closed' ? 'info' : 'warning'"
                      effect="plain"
                      size="small"
                    >
                      {{ row.status === "published" ? "已发布" : row.status === "closed" ? "已关闭" : "草稿" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="发布时间" width="150">
                  <template #default="{ row }">
                    {{ row.createdAt ? new Date(row.createdAt).toLocaleString("zh-CN") : "-" }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="80">
                  <template #default="{ row }">
                    <el-button size="small" type="danger" text @click="handleDeleteExam(row.id)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>

          <!-- Scores Tab -->
          <div v-if="activeTab === 'scores'" class="space-y-6 animate-fade-in">
            <!-- Exam List -->
            <template v-if="!selectedExam">
              <div>
                <h2 class="text-3xl font-bold">成绩管理</h2>
                <p class="mt-1" style="color: var(--color-text-secondary)">选择考试查看学生成绩</p>
              </div>

              <div v-if="scoreLoading" class="card-elegant text-center py-12">
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
              <div class="flex items-center justify-between">
                <div>
                  <el-button text class="mb-2" @click="selectedExam = ''">
                    <el-icon class="mr-1"><ArrowLeft /></el-icon>返回
                  </el-button>
                  <h2 class="text-3xl font-bold">{{ selectedExam }}</h2>
                  <p class="mt-1" style="color: var(--color-text-secondary)">共 {{ selectedExamScores.length }} 条成绩记录</p>
                </div>
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
                  <el-table-column label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.status === 'graded' ? 'success' : 'warning'"
                        effect="plain"
                        size="small"
                      >
                        {{ row.status === "graded" ? "已批改" : "未批改" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="提交时间" min-width="150">
                    <template #default="{ row }">
                      {{ row.submittedAt }}
                    </template>
                  </el-table-column>
                  <el-table-column label="考试时长" width="100">
                    <template #default="{ row }">{{ row.duration != null ? row.duration + ' 分钟' : '-' }}</template>
                  </el-table-column>
                  <el-table-column label="操作" width="130">
                    <template #default="{ row }">
                      <el-button size="small" type="primary" text @click="viewDetail(row.id)">详情</el-button>
                      <el-button size="small" type="danger" text @click="handleDeleteScore(row.id)">删除</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </div>

          <!-- Score Detail Dialog -->
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
                <span class="text-2xl font-bold" :style="{ color: editingScore ? '#eab308' : detailData.score >= detailData.passingScore ? '#22c55e' : '#ef4444' }">
                  {{ editingScore ? editedTotalScore : detailData.score }} / {{ detailData.totalPoints }}
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
                    <div v-if="editingScore" class="flex items-center gap-1">
                      <el-input-number
                        v-model="editedScores[q.questionId]"
                        :min="0"
                        :max="q.totalPoints"
                        :step="0.5"
                        :precision="1"
                        size="small"
                        style="width: 100px"
                      />
                      <span class="text-xs" style="color: var(--color-text-secondary)">/ {{ q.totalPoints }} 分</span>
                    </div>
                    <span v-else class="text-sm font-medium" :style="{ color: q.type === 'essay' && q.isCorrect === null ? '#f9a8d4' : q.isCorrect ? '#22c55e' : '#ef4444' }">
                      {{ q.earnedPoints }} / {{ q.totalPoints }} 分
                    </span>
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
                  </div>
                  <div v-else class="text-xs space-y-1" style="color: var(--color-text-secondary)">
                    <p>学生答案: <span :class="q.isCorrect ? 'text-green-600' : 'text-red-600'">{{ formatAnswer(q.studentAnswer, q.options, q.type) || '未作答' }}</span></p>
                    <p>正确答案: <span class="text-green-600">{{ formatAnswer(q.correctAnswer, q.options, q.type) }}</span></p>
                  </div>
                </div>
              </div>
            </div>
            <template #footer>
              <template v-if="editingScore">
                <el-button @click="editingScore = false">取消</el-button>
                <el-button type="primary" :loading="savingScore" @click="saveScore">保存修改</el-button>
              </template>
              <template v-else>
                <el-button @click="startEditScore">修改成绩</el-button>
                <el-button @click="showDetail = false">关闭</el-button>
              </template>
            </template>
          </el-dialog>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Loading, Document, Notebook, DataAnalysis, ArrowLeft } from "@element-plus/icons-vue";
import { useAuthStore } from "../stores/auth";
import { adminApi, scoresApi, examsApi, questionsApi, type ScoreDetail, type AdminScore } from "../api";
import type { Question, Exam } from "../types";

const router = useRouter();
const authStore = useAuthStore();

const activeTab = ref<"overview" | "users" | "questions" | "exams" | "scores">("overview");

const menuItems = [
  { id: "overview" as const, label: "系统概览", description: "查看系统运行状况" },
  { id: "users" as const, label: "用户管理", description: "管理系统用户" },
  { id: "questions" as const, label: "题库管理", description: "管理所有题目" },
  { id: "exams" as const, label: "试卷管理", description: "管理所有试卷" },
  { id: "scores" as const, label: "成绩管理", description: "查看所有成绩" },
];

const stats = ref({ users: 0, questions: 0, exams: 0, records: 0 });

const users = ref<{ id: number; name: string | null; email: string | null; role: string; createdAt: string }[]>([]);
const userLoading = ref(false);
const initLoading = ref(false);

const questions = ref<Question[]>([]);
const questionLoading = ref(false);

const exams = ref<Exam[]>([]);
const examLoading = ref(false);

const scores = ref<AdminScore[]>([]);
const scoreLoading = ref(false);
const selectedExam = ref("");

const examList = computed(() => {
  const map = new Map<string, { students: Set<string>; pending: number }>();
  for (const s of scores.value) {
    if (!map.has(s.examTitle)) map.set(s.examTitle, { students: new Set(), pending: 0 });
    const entry = map.get(s.examTitle)!;
    entry.students.add(s.studentName);
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

const detailData = ref<ScoreDetail | null>(null);
const detailLoading = ref(false);
const editingScore = ref(false);
const savingScore = ref(false);
const editedScores = ref<Record<number, number>>({});

const showDetail = computed({
  get: () => !!detailData.value,
  set: (val) => { if (!val) { detailData.value = null; editingScore.value = false; } },
});

const editedTotalScore = computed(() => {
  const total = Object.values(editedScores.value).reduce((sum, v) => sum + v, 0);
  return Math.round(total * 10) / 10;
});

const startEditScore = () => {
  if (!detailData.value) return;
  editedScores.value = {};
  for (const q of detailData.value.questions) {
    editedScores.value[q.questionId] = q.earnedPoints;
  }
  editingScore.value = true;
};

const saveScore = async () => {
  if (!detailData.value) return;
  savingScore.value = true;
  try {
    const scoreUpdates = Object.entries(editedScores.value).map(([questionId, earnedPoints]) => ({
      questionId: Number(questionId),
      earnedPoints,
    }));
    await adminApi.updateScore(detailData.value.recordId, scoreUpdates);
    ElMessage.success("成绩已修改");
    editingScore.value = false;
    // Reload detail
    detailData.value = await scoresApi.detail(detailData.value.recordId);
    // Reload scores list
    scores.value = await adminApi.scores();
  } catch {
    ElMessage.error("修改失败");
  } finally {
    savingScore.value = false;
  }
};

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

const initAccounts = async () => {
  initLoading.value = true;
  try {
    await adminApi.initAccounts();
    ElMessage.success("测试账号已创建");
    await loadUsers();
    stats.value = await adminApi.stats();
  } catch {
    ElMessage.error("初始化失败");
  } finally {
    initLoading.value = false;
  }
};

const loadUsers = async () => {
  userLoading.value = true;
  try {
    users.value = await adminApi.users();
  } catch {
    users.value = [];
  } finally {
    userLoading.value = false;
  }
};

const loadQuestions = async () => {
  questionLoading.value = true;
  try {
    questions.value = await adminApi.questions();
  } catch {
    questions.value = [];
  } finally {
    questionLoading.value = false;
  }
};

const handleDeleteQuestion = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这道题目吗？已发布的试卷和成绩不受影响。", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await questionsApi.delete(id);
    ElMessage.success("题目已删除");
    await loadQuestions();
    stats.value = await adminApi.stats();
  } catch {
    // cancelled
  }
};

const loadExams = async () => {
  examLoading.value = true;
  try {
    exams.value = await adminApi.exams();
  } catch {
    exams.value = [];
  } finally {
    examLoading.value = false;
  }
};

const handleDeleteExam = async (id: number) => {
  try {
    await ElMessageBox.confirm(
      "删除试卷将同时删除所有学生的考试成绩，此操作不可恢复。确定要删除吗？",
      "确认删除",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" }
    );
    await examsApi.delete(id);
    ElMessage.success("试卷已删除");
    await loadExams();
    stats.value = await adminApi.stats();
  } catch {
    // cancelled
  }
};

const loadScores = async () => {
  scoreLoading.value = true;
  try {
    scores.value = await adminApi.scores();
  } catch {
    scores.value = [];
  } finally {
    scoreLoading.value = false;
  }
};

const handleDeleteScore = async (recordId: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这条成绩记录吗？删除后教师和学生也将无法查看。", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await adminApi.deleteScore(recordId);
    ElMessage.success("成绩已删除");
    await loadScores();
    stats.value = await adminApi.stats();
  } catch {
    // cancelled
  }
};

watch(activeTab, (tab) => {
  selectedExam.value = "";
  if (tab === "users") loadUsers();
  else if (tab === "questions") loadQuestions();
  else if (tab === "exams") loadExams();
  else if (tab === "scores") loadScores();
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

onMounted(async () => {
  try {
    stats.value = await adminApi.stats();
  } catch {
    // ignore
  }
});
</script>

<style scoped>
button:not([style*="linear-gradient"]):hover {
  background: rgba(249, 168, 212, 0.1) !important;
  border-color: #f9a8d4 !important;
}
</style>
