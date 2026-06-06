<template>
  <div class="min-h-screen" style="background: var(--color-background)">
    <!-- Header -->
    <header
      class="border-b sticky top-0 z-50 backdrop-blur-sm"
      style="border-color: var(--color-border); background: rgba(255,255,255,0.8)"
    >
      <div class="container flex items-center justify-between h-16">
        <el-button text @click="$router.push(authStore.isAdmin ? '/admin/dashboard' : '/teacher/dashboard')">
          <el-icon class="mr-1"><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="text-lg font-bold gradient-text">题库管理</h1>
        <div style="width: 64px"></div>
      </div>
    </header>

    <div class="container py-8">
      <div class="flex justify-end mb-6">
        <el-button type="primary" @click="openNewForm">
          <el-icon class="mr-1"><Plus /></el-icon>
          新增题目
        </el-button>
      </div>

      <!-- Form Dialog -->
      <el-dialog
        v-model="showForm"
        :title="editingId ? '编辑题目' : '新增题目'"
        width="680px"
        destroy-on-close
      >
        <el-form label-position="top" class="space-y-4">
          <el-form-item label="题目类型">
            <el-select v-model="formData.type" class="w-full" @change="handleTypeChange">
              <el-option value="single" label="单选题" />
              <el-option value="multiple" label="多选题" />
              <el-option value="trueFalse" label="判断题" />
              <el-option value="fillBlank" label="填空题" />
              <el-option value="essay" label="问答题" />
            </el-select>
          </el-form-item>

          <el-form-item label="题目内容">
            <el-input
              v-model="formData.title"
              type="textarea"
              :rows="3"
              placeholder="输入题目内容..."
            />
          </el-form-item>

          <!-- Options Editor -->
          <div
            v-if="needsOptions"
            class="p-4 rounded-xl border space-y-3"
            style="border-color: var(--color-border); background: rgba(248,250,252,0.5)"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">选项设置</span>
              <el-button size="small" @click="addOption">
                <el-icon class="mr-1"><Plus /></el-icon>
                增加选项
              </el-button>
            </div>
            <p class="text-xs" style="color: var(--color-text-secondary)">
              {{ formData.type === "multiple" ? "勾选多个正确答案" : formData.type === "trueFalse" ? "默认「正确 / 错误」，也可增加更多选项" : "请填写各选项内容并选择一个正确答案" }}
            </p>

            <div
              v-for="option in formData.options"
              :key="option.key"
              class="flex flex-wrap items-center gap-2 sm:flex-nowrap"
            >
              <span class="w-8 shrink-0 text-sm font-semibold" style="color: #f9a8d4">
                {{ option.key }}.
              </span>
              <el-input
                v-model="option.text"
                :placeholder="`选项 ${option.key}`"
                class="flex-1"
                style="min-width: 120px"
              />
              <el-radio-group
                v-if="formData.type === 'single' || formData.type === 'trueFalse'"
                v-model="formData.correctAnswer"
                class="shrink-0"
              >
                <el-radio :value="option.key">答案</el-radio>
              </el-radio-group>
              <el-checkbox-group
                v-else
                v-model="multipleAnswers"
                class="shrink-0"
              >
                <el-checkbox :value="option.key">答案</el-checkbox>
              </el-checkbox-group>
              <el-button
                size="small"
                text
                type="danger"
                @click="removeOption(option.key)"
                class="shrink-0"
              >
                删除
              </el-button>
            </div>
          </div>

          <!-- Fill Blank Answer -->
          <el-form-item v-if="formData.type === 'fillBlank'" label="参考答案">
            <el-input
              v-model="formData.fillBlankAnswer"
              placeholder="多个空用 | 分隔，如：答案1|答案2"
            />
          </el-form-item>

          <!-- Essay Answer & Rubric -->
          <el-form-item v-if="formData.type === 'essay'" label="参考答案">
            <el-input
              v-model="formData.essayAnswer"
              type="textarea"
              :rows="4"
              placeholder="输入问答题的参考答案..."
            />
          </el-form-item>
          <el-form-item v-if="formData.type === 'essay'" label="AI 评分标准（选填）">
            <el-input
              v-model="formData.gradingRubric"
              type="textarea"
              :rows="3"
              placeholder="输入评分标准，AI 将根据此标准评分。如：满分10分，观点正确4分，论述清晰3分，举例恰当3分"
            />
          </el-form-item>

          <el-form-item label="答案解析（选填）">
            <el-input
              v-model="formData.explanation"
              type="textarea"
              :rows="2"
              placeholder="选填，学生作答后可查看..."
            />
          </el-form-item>

          <div class="grid grid-cols-2 gap-4">
            <el-form-item label="难度">
              <el-select v-model="formData.difficulty" class="w-full">
                <el-option value="easy" label="简单" />
                <el-option value="medium" label="中等" />
                <el-option value="hard" label="困难" />
              </el-select>
            </el-form-item>
          </div>

          <el-form-item label="分类">
            <el-input v-model="formData.category" placeholder="如：第一章 基础概念" />
          </el-form-item>
        </el-form>

        <template #footer>
          <el-button @click="showForm = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            {{ saving ? "保存中..." : editingId ? "保存修改" : "添加题目" }}
          </el-button>
        </template>
      </el-dialog>

      <!-- Loading -->
      <div v-if="loading" class="card-elegant text-center py-12">
        <el-icon class="is-loading" :size="32" style="color: #f9a8d4"><Loading /></el-icon>
        <p class="mt-4" style="color: var(--color-text-secondary)">正在加载题库...</p>
      </div>

      <!-- Empty State -->
      <div v-else-if="questions.length === 0" class="card-elegant text-center py-12">
        <el-icon :size="48" style="color: var(--color-border)"><Document /></el-icon>
        <p class="mt-4 mb-4" style="color: var(--color-text-secondary)">暂无题目</p>
        <el-button type="primary" @click="openNewForm">创建第一道题目</el-button>
      </div>

      <!-- Type Categories -->
      <template v-else-if="!selectedType">
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="item in typeCategories"
            :key="item.type"
            class="card-elegant hover:shadow-lg transition-shadow cursor-pointer text-center"
            @click="selectedType = item.type"
          >
            <h3 class="font-semibold text-lg">{{ item.label }}</h3>
            <p class="text-sm mt-1" style="color: var(--color-text-secondary)">{{ item.count }} 道题</p>
          </div>
        </div>
      </template>

      <!-- Questions in selected type -->
      <template v-else>
        <div class="mb-4">
          <el-button text @click="selectedType = ''">
            <el-icon class="mr-1"><ArrowLeft /></el-icon>返回分类
          </el-button>
          <h2 class="text-2xl font-bold mt-2">{{ getTypeLabel(selectedType) }}</h2>
          <p class="text-sm" style="color: var(--color-text-secondary)">{{ filteredQuestions.length }} 道题目</p>
        </div>

        <div class="space-y-4">
          <div
            v-for="(question, index) in filteredQuestions"
            :key="question.id"
            class="card-elegant hover:shadow-lg transition-shadow"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center gap-3 mb-2 flex-wrap">
                  <span class="text-sm font-semibold" style="color: #f9a8d4">{{ index + 1 }}</span>
                  <el-tag
                    size="small"
                    :type="question.difficulty === 'easy' ? 'success' : question.difficulty === 'hard' ? 'danger' : 'warning'"
                    effect="plain"
                  >
                    {{ getDifficultyLabel(question.difficulty) }}
                  </el-tag>
                  <span v-if="question.category" class="text-xs" style="color: var(--color-text-secondary)">{{ question.category }}</span>
                </div>
                <p class="font-medium mb-2">{{ question.title }}</p>
                <div v-if="question.options && Object.keys(question.options).length > 0" class="text-sm space-y-1 mb-2">
                  <p
                    v-for="(text, key) in question.options"
                    :key="key"
                    :style="{ color: question.correctAnswer.split(',').includes(String(key)) ? '#f9a8d4' : 'var(--color-text-secondary)', fontWeight: question.correctAnswer.split(',').includes(String(key)) ? 500 : 400 }"
                  >
                    {{ key }}. {{ text }}
                    <span v-if="question.correctAnswer.split(',').includes(String(key))">（正确）</span>
                  </p>
                </div>
                <div v-if="question.type === 'fillBlank'" class="text-sm mb-2" style="color: var(--color-text-secondary)">
                  参考答案: {{ question.correctAnswer }}
                </div>
                <div v-if="question.type === 'essay'" class="text-sm mb-2" style="color: var(--color-text-secondary)">
                  <p>参考答案: {{ question.correctAnswer }}</p>
                  <p v-if="question.gradingRubric">评分标准: {{ question.gradingRubric }}</p>
                </div>
              </div>
              <div class="flex gap-2 ml-4 shrink-0">
                <el-button size="small" type="primary" text @click="handleEdit(question)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" text @click="handleDelete(question.id)">
                  删除
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Stats -->
      <div v-if="questions.length > 0" class="mt-8 p-6 rounded-xl border" style="background: rgba(249,168,212,0.05); border-color: rgba(249,168,212,0.2)">
        <div class="grid grid-cols-3 gap-4 text-center">
          <div>
            <p class="text-2xl font-bold" style="color: #f9a8d4">{{ questions.length }}</p>
            <p class="text-sm" style="color: var(--color-text-secondary)">总题数</p>
          </div>
          <div>
            <p class="text-2xl font-bold" style="color: #f9a8d4">{{ questions.filter(q => q.difficulty === 'easy').length }}</p>
            <p class="text-sm" style="color: var(--color-text-secondary)">简单题</p>
          </div>
          <div>
            <p class="text-2xl font-bold" style="color: #f9a8d4">{{ questions.filter(q => q.difficulty === 'medium').length }}</p>
            <p class="text-sm" style="color: var(--color-text-secondary)">中等题</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowLeft, Plus, Loading, Document } from "@element-plus/icons-vue";
import { questionsApi } from "../api";
import { useAuthStore } from "../stores/auth";
import type { Question, QuestionType, Difficulty } from "../types";

const authStore = useAuthStore();
const OPTION_KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

interface OptionItem {
  key: string;
  text: string;
}

interface FormData {
  type: QuestionType;
  title: string;
  difficulty: Difficulty;
  category: string;
  options: OptionItem[];
  correctAnswer: string;
  explanation: string;
  fillBlankAnswer: string;
  essayAnswer: string;
  gradingRubric: string;
}

const questions = ref<Question[]>([]);
const loading = ref(true);
const saving = ref(false);
const showForm = ref(false);
const editingId = ref<number | null>(null);
const selectedType = ref("");

const getEmptyForm = (type: QuestionType = "single"): FormData => ({
  type,
  title: "",
  difficulty: "medium",
  category: "",
  options: type === "trueFalse"
    ? [
        { key: "A", text: "正确" },
        { key: "B", text: "错误" },
      ]
    : [
        { key: "A", text: "" },
        { key: "B", text: "" },
        { key: "C", text: "" },
        { key: "D", text: "" },
      ],
  correctAnswer: "",
  explanation: "",
  fillBlankAnswer: "",
  essayAnswer: "",
  gradingRubric: "",
});

const formData = ref<FormData>(getEmptyForm());

// 题型分类
const typeCategories = computed(() => {
  const types = [
    { type: "single", label: "单选题" },
    { type: "multiple", label: "多选题" },
    { type: "trueFalse", label: "判断题" },
    { type: "fillBlank", label: "填空题" },
    { type: "essay", label: "问答题" },
  ];
  return types.map(t => ({
    ...t,
    count: questions.value.filter(q => q.type === t.type).length,
  })).filter(t => t.count > 0);
});

// 当前题型下的题目
const filteredQuestions = computed(() => {
  if (!selectedType.value) return questions.value;
  return questions.value.filter(q => q.type === selectedType.value);
});

// Computed array that bridges el-checkbox-group (needs array) with correctAnswer (comma-separated string)
const multipleAnswers = computed({
  get: () => formData.value.correctAnswer ? formData.value.correctAnswer.split(",").filter(Boolean) : [],
  set: (val: string[]) => { formData.value.correctAnswer = val.sort().join(","); },
});

const needsOptions = computed(() =>
  formData.value.type === "single" || formData.value.type === "multiple" || formData.value.type === "trueFalse"
);

const needsEssayFields = computed(() => formData.value.type === "essay");

const typeLabels: Record<string, string> = {
  single: "单选题", multiple: "多选题", trueFalse: "判断题", fillBlank: "填空题", essay: "问答题",
};
const difficultyLabels: Record<string, string> = {
  easy: "简单", medium: "中等", hard: "困难",
};
const getTypeLabel = (t: string) => typeLabels[t] ?? t;
const getDifficultyLabel = (d: string) => difficultyLabels[d] ?? d;

const loadQuestions = async () => {
  loading.value = true;
  try {
    questions.value = await questionsApi.list();
  } catch {
    questions.value = [];
  } finally {
    loading.value = false;
  }
};

const handleTypeChange = (type: QuestionType) => {
  formData.value = {
    ...getEmptyForm(type),
    title: formData.value.title,
    difficulty: formData.value.difficulty,
    category: formData.value.category,
    explanation: formData.value.explanation,
  };
};

const addOption = () => {
  const usedKeys = new Set(formData.value.options.map((o) => o.key));
  const nextKey = OPTION_KEYS.split("").find((k) => !usedKeys.has(k));
  if (!nextKey) return;
  formData.value.options.push({ key: nextKey, text: "" });
};

const removeOption = (key: string) => {
  if (formData.value.options.length <= 2) return;
  formData.value.options = formData.value.options.filter((o) => o.key !== key);
  if (formData.value.type === "multiple") {
    formData.value.correctAnswer = formData.value.correctAnswer
      .split(",")
      .filter((k) => k && k !== key)
      .join(",");
  } else if (formData.value.correctAnswer === key) {
    formData.value.correctAnswer = "";
  }
};

const validateForm = (): boolean => {
  if (!formData.value.title.trim()) {
    ElMessage.warning("请输入题目内容");
    return false;
  }
  if (formData.value.type === "fillBlank") {
    if (!formData.value.fillBlankAnswer.trim()) {
      ElMessage.warning("请输入填空题参考答案");
      return false;
    }
    return true;
  }
  if (formData.value.type === "essay") {
    if (!formData.value.essayAnswer.trim()) {
      ElMessage.warning("请输入问答题参考答案");
      return false;
    }
    return true;
  }
  const emptyOption = formData.value.options.find((o) => !o.text.trim());
  if (emptyOption) {
    ElMessage.warning(`请填写选项 ${emptyOption.key} 的内容`);
    return false;
  }
  if (!formData.value.correctAnswer) {
    ElMessage.warning(formData.value.type === "multiple" ? "请至少选择一个正确答案" : "请选择正确答案");
    return false;
  }
  return true;
};

const handleSave = async () => {
  if (!validateForm()) return;
  saving.value = true;

  try {
    const f = formData.value;
    const options = (f.type === "fillBlank" || f.type === "essay")
      ? undefined
      : Object.fromEntries(f.options.map((o) => [o.key, o.text]));

    const correctAnswer = f.type === "fillBlank" ? f.fillBlankAnswer.trim()
      : f.type === "essay" ? f.essayAnswer.trim()
      : f.correctAnswer;

    const payload = {
      type: f.type,
      title: f.title.trim(),
      options,
      correctAnswer,
      explanation: f.explanation || undefined,
      difficulty: f.difficulty,
      category: f.category || undefined,
      points: 1,
      gradingRubric: f.type === "essay" && f.gradingRubric.trim() ? f.gradingRubric.trim() : undefined,
    };

    if (editingId.value) {
      await questionsApi.update(editingId.value, payload);
      ElMessage.success("题目已更新");
    } else {
      await questionsApi.create(payload);
      ElMessage.success("题目已保存到题库");
    }
    showForm.value = false;
    editingId.value = null;
    formData.value = getEmptyForm();
    await loadQuestions();
  } catch (err: any) {
    ElMessage.error("保存失败: " + (err?.response?.data?.error || err?.message || "未知错误"));
  } finally {
    saving.value = false;
  }
};

const handleEdit = (question: Question) => {
  editingId.value = question.id;
  const options = question.options
    ? Object.entries(question.options)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, text]) => ({ key, text }))
    : getEmptyForm(question.type).options;

  formData.value = {
    type: question.type,
    title: question.title,
    difficulty: question.difficulty,
    category: question.category ?? "",
    options: options.length > 0 ? options : getEmptyForm(question.type).options,
    correctAnswer: (question.type === "fillBlank" || question.type === "essay") ? "" : question.correctAnswer,
    fillBlankAnswer: question.type === "fillBlank" ? question.correctAnswer : "",
    essayAnswer: question.type === "essay" ? question.correctAnswer : "",
    gradingRubric: question.gradingRubric ?? "",
    explanation: question.explanation ?? "",
  };
  showForm.value = true;
};

const handleDelete = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这道题目吗？", "确认删除", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
    await questionsApi.delete(id);
    ElMessage.success("题目已删除");
    await loadQuestions();
  } catch {
    // cancelled
  }
};

const openNewForm = () => {
  editingId.value = null;
  formData.value = getEmptyForm();
  showForm.value = true;
};

onMounted(loadQuestions);
</script>
