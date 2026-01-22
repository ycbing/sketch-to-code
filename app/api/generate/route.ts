// app/api/generate/route.ts
import { streamText, generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// 创建智谱 AI 客户端
const zhipu = createOpenAI({
  baseURL: process.env.ZHIPU_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
  apiKey: process.env.ZHIPU_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const { parts } = messages[0];

    const result = await streamText({
      model: zhipu.chat("glm-4v-flash"), // 智谱 GLM-4V Flash 视觉模型（免费版）
      messages: [
        {
          role: "system",
          content: `你是一个专业的前端开发专家。根据用户提供的 UI 草图，生成对应的 React 组件代码。

要求：
- 使用 React + TypeScript
- 使用 Tailwind CSS 进行样式设计
- 代码结构清晰，组件化合理
- 尽可能还原草图中的布局和元素
- 添加适当的响应式设计
- 只输出可运行的代码，不要解释

输出格式：
\`\`\`tsx
// 完整的 React 组件代码
\`\`\``,
        },
        {
          role: "user",
          content: [
            // {
            //   type: "file_url",
            //   file_url: {
            //     url: parts[0].url,
            //   },
            // },
            {
              type: "text",
              text: parts[0].text
                ? `请根据这个草图生成 React 代码。额外要求：${parts[0].text}`
                : "请根据这个草图生成 React 代码，尽可能还原设计。",
            },
          ],
        },
      ],
      // maxOutputTokens: 4096,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
