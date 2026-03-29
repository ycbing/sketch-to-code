import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { versions } from "@/lib/server-db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** GET /api/projects/[projectId]/versions — 获取项目的所有版本 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const allVersions = await db
      .select()
      .from(versions)
      .where(eq(versions.projectId, projectId))
      .orderBy(desc(versions.versionNum));

    return NextResponse.json(allVersions);
  } catch (error) {
    console.error("GET /api/projects/[projectId]/versions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 },
    );
  }
}

/** POST /api/projects/[projectId]/versions — 创建新版本 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const {
      id,
      versionNum,
      sketchData,
      sketchImage,
      generatedCode,
      requirements,
      createdAt,
    } = body;

    if (!id || !generatedCode) {
      return NextResponse.json(
        { error: "id and generatedCode are required" },
        { status: 400 },
      );
    }

    await db.insert(versions).values({
      id,
      projectId,
      versionNum: versionNum ?? 1,
      sketchData: sketchData ?? null,
      sketchImage: sketchImage ?? null,
      generatedCode,
      requirements: requirements ?? null,
      createdAt: new Date(createdAt).toISOString(),
    });

    return NextResponse.json(
      {
        id,
        projectId,
        versionNum,
        sketchData,
        sketchImage,
        generatedCode,
        requirements,
        createdAt,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/projects/[projectId]/versions error:", error);
    return NextResponse.json(
      { error: "Failed to create version" },
      { status: 500 },
    );
  }
}
