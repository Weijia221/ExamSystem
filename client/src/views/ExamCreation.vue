<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <el-button text @click="$router.push('/teacher/dashboard')">
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="text-lg font-bold gradient-text">创建试卷</h1>
        <div style="width: 64px"></div>
      </div>
    </header>

    <div class="container py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Form -->
        <div class="lg:col-span-2">
          <div class="card-elegant space-y-6">
            <h2 class="text-2xl font-bold">试卷信息</h2>

            <el-form label-position="top">
              <el-form-item label="试卷标题">
                <el-input v-model="examData.title" placeholder="如：第一章测试卷" />
              </el-form-item>

              <el-form-item label="试卷描述">
                <el-input
                  v-model="examData.description"
                  type="textarea"
                  :rows="3"
                  placeholder="输入试卷描述..."
                />
              </el-form-item>

              <div class="grid grid-cols-2 gap-4">
                <el-form-item label="时长（分钟）">
                  <el-input-number v-model="examData.duration" :min="1" class="w-full" />
                </el-form-item>
                <el-form-item label="总分">
                  <el-input-number v-model="examData.totalPoints" :min="1" class="w-full" />
                </el-form-item>
              </div>

              <el-form-item label="及格分数">
                <el-input-number
                  v-model="examData.passingScore"
                  :min="0"
                  :max="examData.totalPoints"
                  class="w-full"
                />
              </el-form-item>
            </el-form>
          </div>
        </div>

        <!-- Summary -->
        <div>
          <div class="card-elegant sticky top-24 space-y-6">
            <h2 class="text-lg font-bold">试卷预览</h2>

            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span style="color: var(--color-text-secondary)">试卷标题</span>
                <span class="font-medium">{{ examData.title || "未设置" }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span style="color: var(--color-text-secondary)">时长</span>
                <span class="font-medium">{{ examData.duration }} 分钟</span>
              </div>
              <div class="flex justify-between text-sm">
                <span style="color: var(--color-text-secondary)">总分</span>
                <span class="font-medium">{{ examData.totalPoints }} 分</span>
              </div>
              <div class="flex justify-between text-sm">
                <span style="color: var(--color-text-secondary)">及格分</span>
                <span class="font-medium">{{ examData.passingScore }} 分</span>
              </div>
              <div class="flex justify-between text-sm pt-3" style="border-top: 1px solid var(--color-border)">
                <span style="color: var(--color-text-secondary)">题目数</span>
                <span class="font-medium">{{ selectedQuestions.length }}</span>
              </div>
            </div>

            <el-button type="primary" class="w-full" :loading="publishing" @click="handlePublish">
              发布试卷
            </el-button>
          </div>
        </div>
      </div>

      <!-- Questions Selection -->
      <div class="mt-8">
        <div class="card-elegant">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-bold">选择题目</h2>
            <div class="flex gap-2">
              <el-button @click="openQuestionBank">
                <el-icon class="mr-1"><FolderOpened /></el-icon>
                从题库选择
              </el-button>
              <el-button type="primary" plain @click="addSampleQuestion">
                <el-icon class="mr-1"><Plus /></el-icon>
                添加题目
              </el-button>
            </div>
          </div>

          <!-- Question Bank Dialog -->
          <el-dialog v-model="showQuestionBank" title="题库" width="700px" destroy-on-close>
            <div v-if="bankLoading" class="text-center py-8">
              <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
              <p class="mt-4" style="color: var(--color-text-secondary)">正在加载题库...</p>
            </div>
            <div v-else-if="bankQuestions.length === 0" class="text-center py-8" style="color: var(--color-text-secondary)">
              题库为空，请先在题库管理中添加题目
            </div>
            <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              <div
                v-for="q in bankQuestions"
                :key="q.id"
                class="flex items-start gap-4 p-4 rounded-xl border transition-colors"
                :style="{
                  borderColor: selectedInBank.includes(q.id) ? '#f9a8d4' : 'var(--color-border)',
                  background: selectedInBank.includes(q.id) ? 'rgba(249,168,212,0.05)' : 'transparent',
                }"
              >
                <el-checkbox
                  :model-value="selectedInBank.includes(q.id)"
                  :disabled="selectedQuestions.some((sq) => sq.id === q.id)"
                  @change="(checked: boolean) => toggleBankSelection(q.id, checked)"
                />
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <el-tag size="small" effect="plain">{{ getTypeLabel(q.type) }}</el-tag>
                    <span class="text-xs" style="color: var(--color-text-secondary)">{{ q.points }} 分</span>
                  </div>
                  <p class="text-sm font-medium line-clamp-2">{{ q.title }}</p>
                </div>
              </div>
            </div>
            <template #footer>
              <el-button @click="showQuestionBank = false">取消</el-button>
              <el-button
                type="primary"
                :disabled="newSelections.length === 0"
                @click="confirmBankSelection"
              >
                确认选择 ({{ newSelections.length }})
              </el-button>
            </template>
          </el-dialog>

          <!-- Selected Questions -->
          <div v-if="selectedQuestions.length === 0" class="text-center py-12" style="color: var(--color-text-secondary)">
            <el-icon :size="48" style="color: var(--color-border)"><Document /></el-icon>
            <p class="mt-4">还未选择任何题目</p>
          </div>
          <div v-else class="space-y-3">
            <div
              v-for="(question, index) in selectedQuestions"
              :key="question.id"
              class="flex items-center justify-between p-4 rounded-xl border"
              style="border-color: var(--color-border); background: rgba(248,250,252,0.5)"
            >
              <div class="flex-1">
                <p class="font-medium">{{ index + 1 }}. {{ question.title }}</p>
                <p class="text-sm mt-1" style="color: var(--color-text-secondary)">
                  {{ getTypeLabel(question.type) }} · {{ question.points }} 分
                </p>
              </div>
              <el-button size="small" type="danger" text @click="removeQuestion(question.id)">
                移除
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, FolderOpened, Plus, Loading, Document } from "@element-plus/icons-vue";
import { questionsApi, examsApi } from "../api";
import type { Question } from "../types";

const router = useRouter();

interface SelectedQuestion {
  id: number;
  title: string;
  type: string;
  points: number;
}

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题",
};
const getTypeLabel = (t: string) => typeLabels[t] ?? t;

const examData = ref({
  title: "",
  description: "",
  duration: 60,
  totalPoints: 100,
  passingScore: 60,
});

const selectedQuestions = ref<SelectedQuestion[]>([]);
const bankQuestions = ref<Question[]>([]);
const bankLoading = ref(false);
const showQuestionBank = ref(false);
const selectedInBank = ref<number[]>([]);
const publishing = ref(false);

const newSelections = ref<number[]>([]);

const openQuestionBank = async () => {
  const existingIds = selectedQuestions.value.map((q) => q.id);
  selectedInBank.value = [...existingIds];
  newSelections.value = [];
  showQuestionBank.value = true;

  bankLoading.value = true;
  try {
    bankQuestions.value = await questionsApi.list();
  } catch {
    bankQuestions.value = [];
  } finally {
    bankLoading.value = false;
  }
};

const toggleBankSelection = (id: number, checked: boolean) => {
  if (checked) {
    selectedInBank.value.push(id);
    if (!newSelections.value.includes(id)) {
      newSelections.value.push(id);
    }
  } else {
    selectedInBank.value = selectedInBank.value.filter((i) => i !== id);
    newSelections.value = newSelections.value.filter((i) => i !== id);
  }
};

const confirmBankSelection = () => {
  const newQuestions = newSelections.value
    .map((id) => {
      const q = bankQuestions.value.find((bq) => bq.id === id);
      return q ? { id: q.id, title: q.title, type: q.type, points: Number(q.points) } : null;
    })
    .filter(Boolean) as SelectedQuestion[];

  selectedQuestions.value.push(...newQuestions);
  showQuestionBank.value = false;
};

const addSampleQuestion = () => {
  selectedQuestions.value.push({
    id: Date.now(),
    title: `示例题目 ${selectedQuestions.value.length + 1}`,
    type: "single",
    points: 5,
  });
};

const removeQuestion = (id: number) => {
  selectedQuestions.value = selectedQuestions.value.filter((q) => q.id !== id);
};

const handlePublish = async () => {
  if (!examData.value.title.trim()) {
    ElMessage.warning("请输入试卷标题");
    return;
  }
  if (selectedQuestions.value.length === 0) {
    ElMessage.warning("请至少添加一道题目");
    return;
  }

  publishing.value = true;
  try {
    // Filter out local-only IDs (from addSampleQuestion)
    const questionIds = selectedQuestions.value
      .filter((q) => q.id < 1_000_000_000)
      .map((q) => q.id);

    if (questionIds.length === 0) {
      ElMessage.warning("请从题库中选择题目");
      return;
    }

    const result = await examsApi.create({
      title: examData.value.title,
      description: examData.value.description || undefined,
      totalPoints: examData.value.totalPoints,
      duration: examData.value.duration,
      passingScore: examData.value.passingScore,
      questionIds,
    });

    // Auto-publish
    await examsApi.publish(result.id);

    ElMessage.success("试卷已发布！");
    router.push("/teacher/dashboard");
  } catch {
    ElMessage.error("发布失败，请稍后重试");
  } finally {
    publishing.value = false;
  }
};
</script>
