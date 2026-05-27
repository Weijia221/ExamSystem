<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center space-y-6 animate-fade-in-up">
      <h1 class="text-8xl font-black gradient-text">404</h1>
      <p class="text-xl" style="color: var(--color-text-secondary)">页面不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>
