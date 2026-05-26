import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server-db";
import { users } from "@/lib/server-db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await db
      .select({
        aiProvider: users.aiProvider,
        aiApiKey: users.aiApiKey,
        aiBaseURL: users.aiBaseURL,
        aiModel: users.aiModel,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({
      provider: user.aiProvider || "zhipu",
      apiKey: user.aiApiKey ? "••••••••" : "",
      hasApiKey: !!user.aiApiKey,
      baseURL: user.aiBaseURL || "",
      model: user.aiModel || "",
    });
  } catch (error) {
    console.error("Get AI config error:", error);
    return NextResponse.json({ error: "获取配置失败" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { provider, apiKey, baseURL, model } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    await db
      .update(users)
      .set({
        aiProvider: provider,
        aiApiKey: apiKey,
        aiBaseURL: baseURL || null,
        aiModel: model || null,
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Save AI config error:", error);
    return NextResponse.json({ error: "保存配置失败" }, { status: 500 });
  }
}
