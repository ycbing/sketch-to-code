import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/server-db";
import { users } from "@/lib/server-db/schema";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "邮箱和密码不能为空" },
        { status: 400 },
      );
    }

    // Check if user already exists
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existing) {
      return NextResponse.json(
        { error: "该邮箱已被注册" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const id = nanoid();
    const now = new Date().toISOString();

    await db.insert(users).values({
      id,
      email,
      password: hashedPassword,
      name: name || null,
      credits: 200,
      createdAt: now,
    });

    return NextResponse.json({
      user: {
        id,
        email,
        name: name || null,
        credits: 200,
        createdAt: now,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "注册失败，请稍后重试" },
      { status: 500 },
    );
  }
}
