import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects } from "@/lib/server-db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { initDatabase } from "@/lib/init-db";

initDatabase();

export const dynamic = "force-dynamic";

/** POST /api/projects/[projectId]/share — 生成分享链接 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
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

/** DELETE /api/projects/[projectId]/share — 取消分享 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;

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
