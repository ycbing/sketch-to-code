import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects, versions } from "@/lib/server-db/schema";
import { eq, desc } from "drizzle-orm";
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
    const project = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .get();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权访问该项目" }, { status: 403 });
    }

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  try {
    const user = await requireAuth();
    if (!user) {
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
    if (project.userId !== user.id) {
      return NextResponse.json({ error: "无权操作该项目" }, { status: 403 });
    }

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
      createdAt: createdAt ? new Date(createdAt).toISOString() : new Date().toISOString(),
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