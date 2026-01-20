// app/api/generate/route.ts
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
// 或使用 Claude（图像理解更强）
// import { anthropic } from '@ai-sdk/anthropic';

export async function POST(req: Request) {
  const { image, requirements } = await req.json();

  const result = await streamText({
    model: openai("gpt-4o"), // 或 anthropic('claude-3-5-sonnet-20241022')
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
          {
            type: "image",
            image: image, // base64 或 URL
          },
          {
            type: "text",
            text: requirements
              ? `请根据这个草图生成 React 代码。额外要求：${requirements}`
              : "请根据这个草图生成 React 代码，尽可能还原设计。",
          },
        ],
      },
    ],
    maxTokens: 4096,
  });

  return result.toDataStreamResponse();
}
