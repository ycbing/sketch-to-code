import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";

initDatabase();

export const dynamic = "force-dynamic";

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
