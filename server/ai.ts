import { ENV } from "./_core/env";
import type { Response } from "express";
import axios from "axios";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  messages: ChatMessage[];
  maxTokens?: number;
  stream?: boolean;
}

interface GradeResult {
  score: number;
  comment: string;
}

// 创建 axios 实例，设置更长的超时
const deepseekClient = axios.create({
  timeout: 120000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * 调用 DeepSeek API（非流式）
 */
async function callDeepSeek(options: ChatOptions): Promise<string> {
  if (!ENV.deepseekApiKey) {
    throw new Error("DEEPSEEK_API_KEY 未配置");
  }

  const response = await deepseekClient.post(
    `${ENV.deepseekApiUrl}/chat/completions`,
    {
      model: "deepseek-chat",
      messages: options.messages,
      max_tokens: options.maxTokens ?? 1024,
      stream: false,
    },
    {
      headers: {
        Authorization: `Bearer ${ENV.deepseekApiKey}`,
      },
    }
  );

  return response.data.choices?.[0]?.message?.content ?? "";
}

/**
 * 流式调用 DeepSeek API（SSE）
 */
export async function streamChat(
  messages: ChatMessage[],
  res: Response,
  maxTokens?: number
): Promise<void> {
  if (!ENV.deepseekApiKey) {
    res.status(500).json({ error: "AI 服务未配置" });
    return;
  }

  try {
    const response = await deepseekClient.post(
      `${ENV.deepseekApiUrl}/chat/completions`,
      {
        model: "deepseek-chat",
        messages,
        max_tokens: maxTokens ?? 1024,
        stream: true,
      },
      {
        headers: {
          Authorization: `Bearer ${ENV.deepseekApiKey}`,
        },
        responseType: "stream",
      }
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = response.data;
    let buffer = "";

    stream.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          res.write("data: [DONE]\n\n");
          continue;
        }

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        } catch {
          // skip malformed JSON
        }
      }
    });

    stream.on("end", () => {
      res.end();
    });

    stream.on("error", (err: Error) => {
      console.error("[AI] Stream error:", err);
      res.end();
    });
  } catch (err) {
    console.error("[AI] DeepSeek API error:", err);
    res.status(500).json({ error: "AI 服务调用失败" });
  }
}

/**
 * 学生聊天 — 封装系统提示词
 */
export function buildStudentChatMessages(
  userMessage: string,
  context?: { questionTitle?: string }
): ChatMessage[] {
  const systemPrompt = `你是一个友好的学习助手，帮助学生理解考试相关的知识。
- 回答要简洁明了，适合学生理解
- 如果学生问的是具体题目，先引导思考，再给出解答思路
- 使用中文回答`;

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
  ];

  if (context?.questionTitle) {
    messages.push({
      role: "system",
      content: `当前学生正在练习的题目是：${context.questionTitle}`,
    });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}

/**
 * AI 评分 — 问答题自动评分
 */
export async function gradeEssay(
  questionTitle: string,
  correctAnswer: string,
  rubric: string | null,
  studentAnswer: string,
  totalPoints: number
): Promise<GradeResult> {
  const gradingPrompt = `你是一个严格的考试阅卷老师。请根据以下信息为学生的问答题答案评分。

## 题目
${questionTitle}

## 参考答案
${correctAnswer}

${rubric ? `## 评分标准\n${rubric}` : ""}

## 学生答案
${studentAnswer}

## 满分
${totalPoints} 分

请按以下 JSON 格式返回评分结果（不要返回其他内容）：
{"score": 分数, "comment": "评语"}

评分要求：
- score 为 0 到 ${totalPoints} 之间的数字（可以是小数，保留一位）
- comment 简要说明扣分原因和改进建议（50字以内）`;

  const response = await callDeepSeek({
    messages: [
      { role: "system", content: "你是一个严格的考试阅卷系统，只返回JSON格式的评分结果。" },
      { role: "user", content: gradingPrompt },
    ],
    maxTokens: 256,
  });

  try {
    // 提取 JSON 部分（兼容 AI 可能返回额外文本的情况）
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("无法解析 AI 评分结果");
    const result = JSON.parse(jsonMatch[0]);
    return {
      score: Math.min(Math.max(0, Number(result.score) || 0), totalPoints),
      comment: String(result.comment || "AI 评分完成"),
    };
  } catch (err) {
    console.error("[AI] 解析评分结果失败:", err, "原始响应:", response);
    return { score: 0, comment: "AI 评分解析失败，请手动评分" };
  }
}
