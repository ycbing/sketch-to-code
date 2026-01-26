// app/api/generate/route.ts
import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const { parts } = messages[0];

    // 从请求头获取自定义配置（如果有）
    const customConfig = req.headers.get("x-ai-config");
    let config: any = {
      provider: "zhipu",
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
      apiKey: process.env.ZHIPU_API_KEY || "",
      model: "glm-4v-flash",
    };

    if (customConfig) {
      try {
        config = JSON.parse(customConfig);
      } catch (err) {
        console.error("Failed to parse custom config:", err);
      }
    }

    let model: any;

    // 根据提供商创建相应的模型
    if (config.provider === "openai") {
      const openai = createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = openai.chat(config.model);
    } else if (config.provider === "anthropic") {
      const anthropic = createAnthropic({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = anthropic.chat(config.model);
    } else if (config.provider === "siliconflow") {
      const siliconflow = createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });
      model = siliconflow.chat(config.model);
    } else {
      // 默认使用智谱 AI
      const zhipu = createOpenAI({
        baseURL: config.baseURL || "https://open.bigmodel.cn/api/paas/v4",
        apiKey: config.apiKey || "",
      });
      model = zhipu.chat(config.model || "glm-4v-flash");
    }

    const result = await streamText({
      model,
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
            ...(parts[parts.length - 1].url
              ? [
                  {
                    type: "image" as const,
                    image: parts[parts.length - 1].url,
                  },
                ]
              : []),
            {
              type: "text",
              text: parts[0].text
                ? `请根据这个草图生成 React 代码。额外要求：${parts[0].text}`
                : "请根据这个草图生成 React 代码，尽可能还原设计。",
            },
          ],
        },
      ],
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
