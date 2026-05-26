import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";

initDatabase();

export const dynamic = "force-dynamic";

/** GET /api/projects/[projectId] — 获取单个项目 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("GET /api/projects/[projectId] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 },
    );
  }
}

/** PUT /api/projects/[projectId] — 更新项目 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const { name, description } = body;

    const updates: Record<string, any> = { updatedAt: new Date().toISOString() };
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

/** DELETE /api/projects/[projectId] — 删除项目（级联删除版本） */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

    // 先删除所有版本（虽然 FK cascade 应该处理，但显式删除更安全）
    await db.delete(versions).where(eq(versions.projectId, projectId));
    // 删除项目
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
