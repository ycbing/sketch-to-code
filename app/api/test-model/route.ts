import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const config = await req.json();

    // 根据提供商创建相应的客户端
    let response: Response;

    if (config.provider === "openai") {
      const { createOpenAI } = await import("@ai-sdk/openai");
      const openai = createOpenAI({
        baseURL: config.baseURL,
        apiKey: config.apiKey,
      });

      // 测试请求
      response = await fetch(`${config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10,
        }),
      });
    } else if (config.provider === "anthropic") {
      response = await fetch(`${config.baseURL}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10,
        }),
      });
    } else if (config.provider === "zhipu") {
      response = await fetch(`${config.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [{ role: "user", content: "test" }],
          max_tokens: 10,
        }),
      });
    } else {
      return NextResponse.json({ success: false, error: "不支持的提供商" }, { status: 400 });
    }

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const error = await response.text();
      return NextResponse.json({ success: false, error: "API Key 无效" }, { status: 400 });
    }
  } catch (error) {
    console.error("Test model error:", error);
    return NextResponse.json({ success: false, error: "连接失败" }, { status: 500 });
  }
}
