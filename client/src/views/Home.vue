<template>
  <div class="min-h-screen flex flex-col overflow-hidden relative">
    <!-- Background decorations -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full opacity-30 blur-[120px]"
        style="background: linear-gradient(135deg, #f9a8d4, #fbcfe8)"
      />
      <div
        class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[120px]"
        style="background: linear-gradient(135deg, #ec4899, #f472b6)"
      />
    </div>

    <main class="flex-1 flex items-center justify-center px-4 relative z-10">
      <div class="max-w-2xl w-full text-center space-y-10 animate-fade-in-up">
        <div class="space-y-6">
          <div class="space-y-2">
            <h1 class="text-7xl md:text-8xl font-black tracking-tighter gradient-text">
              ExamHub
            </h1>
            <p class="text-xl md:text-2xl font-medium" style="color: var(--color-text-secondary)">
              现代化在线考试与测评平台
            </p>
          </div>

          <div class="flex items-center justify-center gap-6 pt-4">
            <div class="text-center">
              <p class="text-3xl font-bold gradient-text">4</p>
              <p class="text-sm" style="color: var(--color-text-secondary)">题型支持</p>
            </div>
            <div class="w-px h-10" style="background: var(--color-border)"></div>
            <div class="text-center">
              <p class="text-3xl font-bold gradient-text">AI</p>
              <p class="text-sm" style="color: var(--color-text-secondary)">智能评分</p>
            </div>
            <div class="w-px h-10" style="background: var(--color-border)"></div>
            <div class="text-center">
              <p class="text-3xl font-bold gradient-text">∞</p>
              <p class="text-sm" style="color: var(--color-text-secondary)">随时练习</p>
            </div>
          </div>
        </div>

        <div class="flex flex-col items-center gap-4 pt-4">
          <el-button
            type="primary"
            size="large"
            class="btn-elegant-primary"
            style="height: 56px; padding: 0 40px; font-size: 18px; font-weight: 700; border-radius: 28px"
            @click="$router.push('/role-select')"
          >
            开始使用
            <el-icon class="ml-2"><ArrowRight /></el-icon>
          </el-button>
          <p class="text-sm" style="color: var(--color-text-secondary); opacity: 0.6">
            支持教师组卷、学生在线答题与自动评分
          </p>
        </div>

        <!-- Feature cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
          <div
            v-for="feature in features"
            :key="feature.title"
            class="card-elegant text-left group cursor-default"
          >
            <div
              class="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
              :style="{ background: feature.bgColor }"
            >
              <el-icon :size="20" :style="{ color: feature.iconColor }">
                <component :is="feature.icon" />
              </el-icon>
            </div>
            <h3 class="font-semibold mb-1">{{ feature.title }}</h3>
            <p class="text-sm" style="color: var(--color-text-secondary)">
              {{ feature.desc }}
            </p>
          </div>
        </div>
      </div>
    </main>

    <footer class="py-8 text-center text-sm relative z-10" style="color: var(--color-text-secondary); opacity: 0.4">
      <p>© 2026 ExamHub · 开启智能测评新时代</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ArrowRight, Edit, Notebook, DataAnalysis } from "@element-plus/icons-vue";

const features = [
  {
    icon: Edit,
    title: "智能题库",
    desc: "支持单选、多选、判断、填空四大题型，灵活管理",
    bgColor: "rgba(249,168,212,0.1)",
    iconColor: "#f9a8d4",
  },
  {
    icon: Notebook,
    title: "在线组卷",
    desc: "从题库中自由选题组卷，设置考试时长和及格线",
    bgColor: "rgba(236,72,153,0.1)",
    iconColor: "#ec4899",
  },
  {
    icon: DataAnalysis,
    title: "成绩分析",
    desc: "自动评分统计，多维度分析学生考试表现",
    bgColor: "rgba(34,197,94,0.1)",
    iconColor: "#22c55e",
  },
];
</script>
