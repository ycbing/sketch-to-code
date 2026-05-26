import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server-db";
import { users } from "@/lib/server-db/schema";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const RESET_TOKENS = new Map<string, { email: string; expiresAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "请输入邮箱" }, { status: 400 });
    }

    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = nanoid(32);
    RESET_TOKENS.set(token, { email, expiresAt: Date.now() + 3600000 });

    // TODO: Send email with reset link
    // In production, integrate with email service (Resend, SendGrid, etc.)
    console.log(`[Password Reset] Token for ${email}: ${token}`);
    console.log(`[Password Reset] Reset URL: ${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password?token=${token}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset request error:", error);
    return NextResponse.json({ error: "请求失败" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "参数无效" }, { status: 400 });
    }

    const resetData = RESET_TOKENS.get(token);
    if (!resetData || resetData.expiresAt < Date.now()) {
      return NextResponse.json({ error: "重置链接已过期" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, resetData.email));

    RESET_TOKENS.delete(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json({ error: "重置失败" }, { status: 500 });
  }
}
