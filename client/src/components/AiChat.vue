<template>
  <div class="ai-chat-wrapper">
    <!-- Toggle Button -->
    <button
      class="ai-chat-toggle"
      :class="{ expanded: isOpen }"
      @click="isOpen = !isOpen"
    >
      <span v-if="!isOpen">🤖 问AI</span>
      <span v-else>✕ 收起</span>
    </button>

    <!-- Chat Panel -->
    <div v-show="isOpen" class="ai-chat-panel">
      <div class="ai-chat-header">
        <span class="font-semibold text-sm">AI 学习助手</span>
        <el-tag size="small" type="success" effect="plain">在线</el-tag>
      </div>

      <!-- Messages -->
      <div ref="messagesContainer" class="ai-chat-messages">
        <div v-if="messages.length === 0" class="ai-chat-empty">
          <p>👋 你好！有问题可以问我哦</p>
        </div>
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="ai-chat-msg"
          :class="msg.role"
        >
          <div class="ai-chat-bubble" :class="msg.role">
            <pre class="ai-chat-text">{{ msg.content }}</pre>
          </div>
        </div>
        <div v-if="streaming" class="ai-chat-msg assistant">
          <div class="ai-chat-bubble assistant">
            <pre class="ai-chat-text">{{ streamingContent }}▌</pre>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="ai-chat-input">
        <el-input
          v-model="inputText"
          placeholder="输入你的问题..."
          :disabled="streaming"
          @keyup.enter="sendMessage"
        >
          <template #append>
            <el-button
              :loading="streaming"
              @click="sendMessage"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from "vue";
import { aiApi } from "../api";

const props = defineProps<{
  context?: { questionTitle?: string };
}>();

const isOpen = ref(false);
const inputText = ref("");
const streaming = ref(false);
const streamingContent = ref("");
const messagesContainer = ref<HTMLElement | null>(null);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const messages = ref<ChatMessage[]>([]);

const scrollToBottom = async () => {
  await nextTick();
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

watch(isOpen, () => {
  if (isOpen.value) scrollToBottom();
});

const sendMessage = async () => {
  const text = inputText.value.trim();
  if (!text || streaming.value) return;

  messages.value.push({ role: "user", content: text });
  inputText.value = "";
  streaming.value = true;
  streamingContent.value = "";
  await scrollToBottom();

  try {
    const generator = aiApi.chat(text, props.context);
    for await (const chunk of generator) {
      streamingContent.value += chunk;
      await scrollToBottom();
    }
    if (streamingContent.value) {
      messages.value.push({ role: "assistant", content: streamingContent.value });
    }
  } catch (err) {
    messages.value.push({ role: "assistant", content: "抱歉，AI 服务暂时不可用，请稍后再试。" });
  } finally {
    streaming.value = false;
    streamingContent.value = "";
    await scrollToBottom();
  }
};
</script>

<style scoped>
.ai-chat-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.ai-chat-toggle {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  border: none;
  border-radius: 24px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
  transition: all 0.2s;
}
.ai-chat-toggle:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(236, 72, 153, 0.4);
}

.ai-chat-panel {
  width: 380px;
  height: 480px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #f0f0f0;
}

.ai-chat-header {
  padding: 12px 16px;
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 14px;
}

.ai-chat-msg {
  display: flex;
}
.ai-chat-msg.user {
  justify-content: flex-end;
}
.ai-chat-msg.assistant {
  justify-content: flex-start;
}

.ai-chat-bubble {
  max-width: 85%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.5;
}
.ai-chat-bubble.user {
  background: linear-gradient(135deg, #ec4899, #db2777);
  color: white;
  border-bottom-right-radius: 4px;
}
.ai-chat-bubble.assistant {
  background: #f5f5f5;
  color: #333;
  border-bottom-left-radius: 4px;
}

.ai-chat-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.ai-chat-input {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}
</style>
