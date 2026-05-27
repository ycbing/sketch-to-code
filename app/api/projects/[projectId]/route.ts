import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";
import { auth } from "@/lib/auth";

initDatabase();

export const dynamic = "force-dynamic";

async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return session.user;
}

async function checkProjectOwner(projectId: string, userId: string) {
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .get();
  if (!project) return "not_found";
  if (project.userId !== userId) return "forbidden";
  return project;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { projectId } = await params;
    const result = await checkProjectOwner(projectId, user.id);
    if (result === "not_found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (result === "forbidden") {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { projectId } = await params;
    const accessCheck = await checkProjectOwner(projectId, user.id);
    if (accessCheck === "not_found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (accessCheck === "forbidden") {
      return NextResponse.json({ error: "无权修改该项目" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description } = body;

    const updates: Record<string, string> = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;

    await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const { projectId } = await params;
    const accessCheck = await checkProjectOwner(projectId, user.id);
    if (accessCheck === "not_found") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (accessCheck === "forbidden") {
      return NextResponse.json({ error: "无权删除该项目" }, { status: 403 });
    }

    await db.delete(versions).where(eq(versions.projectId, projectId));
    await db.delete(projects).where(eq(projects.id, projectId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }
}