import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects } from "@/lib/server-db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { initDatabase } from "@/lib/init-db";
import { auth } from "@/lib/auth";

initDatabase();

export const dynamic = "force-dynamic";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "无权操作该项目" }, { status: 403 });
    }

    const token = nanoid(16);

    await db
      .update(projects)
      .set({ shareToken: token, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ shareUrl: `/share/${token}`, token });
  } catch (error) {
    console.error("POST /api/projects/[projectId]/share error:", error);
    return NextResponse.json(
      { error: "Failed to share project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { projectId } = await params;

    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "无权操作该项目" }, { status: 403 });
    }

    await db
      .update(projects)
      .set({ shareToken: null, updatedAt: new Date().toISOString() })
      .where(eq(projects.id, projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[projectId]/share error:", error);
    return NextResponse.json(
      { error: "Failed to unshare project" },
      { status: 500 },
    );
  }
}