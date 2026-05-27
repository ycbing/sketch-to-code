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
  const session = await auth();
  try {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { amount, reason } = await req.json();

    if (typeof amount !== "number" || !Number.isInteger(amount) || !reason) {
      return NextResponse.json(
        { error: "参数无效" },
        { status: 400 },
      );
    }

    const newCredits = await db.transaction(async (tx) => {
      const result = await tx
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, session.user.id))
        .get();

      if (!result) {
        throw new Error("USER_NOT_FOUND");
      }

      if (result.credits + amount < 0) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      await tx
        .update(users)
        .set({ credits: sql`${users.credits} + ${amount}` })
        .where(eq(users.id, session.user.id));

      await tx.insert(creditsLog).values({
        id: nanoid(),
        userId: session.user.id,
        amount,
        reason,
        createdAt: new Date().toISOString(),
      });

      return result.credits + amount;
    });

    return NextResponse.json({
      credits: newCredits,
      amount,
      reason,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return NextResponse.json({ error: "用户不存在" }, { status: 404 });
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
      const user = session?.user?.id
        ? await db.select({ credits: users.credits }).from(users).where(eq(users.id, session.user.id)).get()
        : null;
      return NextResponse.json(
        { error: "积分不足", credits: user?.credits ?? 0 },
        { status: 400 },
      );
    }
    console.error("Update credits error:", error);
    return NextResponse.json(
      { error: "积分操作失败" },
      { status: 500 },
    );
  }
}
