import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq, desc } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";

initDatabase();

export const dynamic = "force-dynamic";

/** GET /api/share/[token] — 获取分享项目信息（含最新版本） */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    // 根据 shareToken 查找项目
    const projectList = await db
      .select()
      .from(projects)
      .where(eq(projects.shareToken, token));

    if (projectList.length === 0) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 },
      );
    }

    const project = projectList[0];

    // 获取最新版本
    const versionList = await db
      .select()
      .from(versions)
      .where(eq(versions.projectId, project.id))
      .orderBy(desc(versions.createdAt))
      .limit(1);

    const latestVersion = versionList[0] ?? null;

    return NextResponse.json({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      latestVersion: latestVersion
        ? {
            generatedCode: latestVersion.generatedCode,
            sketchImage: latestVersion.sketchImage,
            createdAt: latestVersion.createdAt,
            versionNum: latestVersion.versionNum,
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/share/[token] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared project" },
      { status: 500 },
    );
  }
}
