import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/server-db";
import { users, creditsLog } from "@/lib/server-db/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const user = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (!user) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    return NextResponse.json({ credits: user.credits });
  } catch (error) {
    console.error("Get credits error:", error);
    return NextResponse.json(
      { error: "获取积分失败" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { amount, reason } = await req.json();

    if (typeof amount !== "number" || !reason) {
      return NextResponse.json(
        { error: "参数无效" },
        { status: 400 },
      );
    }

    // Use a transaction to ensure atomicity
    const result = await db
      .select({ credits: users.credits })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (!result) {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }

    if (result.credits + amount < 0) {
      return NextResponse.json(
        { error: "积分不足", credits: result.credits },
        { status: 400 },
      );
    }

    // Update credits
    await db
      .update(users)
      .set({ credits: sql`${users.credits} + ${amount}` })
      .where(eq(users.id, session.user.id));

    // Log the transaction
    await db.insert(creditsLog).values({
      id: nanoid(),
      userId: session.user.id,
      amount,
      reason,
      createdAt: new Date().toISOString(),
    });

    const newCredits = result.credits + amount;

    return NextResponse.json({
      credits: newCredits,
      amount,
      reason,
    });
  } catch (error) {
    console.error("Update credits error:", error);
    return NextResponse.json(
      { error: "积分操作失败" },
      { status: 500 },
    );
  }
}
