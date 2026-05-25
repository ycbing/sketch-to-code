import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq, desc, and, isNotNull } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";

initDatabase();

export const dynamic = "force-dynamic";

/** GET /api/gallery — 获取所有已分享项目（含最新版本缩略图） */
export async function GET() {
  try {
    // 查找所有有 shareToken 的项目
    const sharedProjects = await db
      .select()
      .from(projects)
      .where(isNotNull(projects.shareToken))
      .orderBy(desc(projects.updatedAt));

    // 为每个项目获取最新版本的缩略图
    const result = await Promise.all(
      sharedProjects.map(async (project) => {
        const versionList = await db
          .select({ sketchImage: versions.sketchImage, createdAt: versions.createdAt })
          .from(versions)
          .where(eq(versions.projectId, project.id))
          .orderBy(desc(versions.createdAt))
          .limit(1);

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          shareToken: project.shareToken,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
          thumbnail: versionList[0]?.sketchImage ?? null,
        };
      }),
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/gallery error:", error);
    return NextResponse.json(
      { error: "Failed to fetch gallery" },
      { status: 500 },
    );
  }
}
