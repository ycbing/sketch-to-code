import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects } from "@/lib/server-db/schema";
import { desc } from "drizzle-orm";
import { initDatabase } from "@/lib/init-db";

// 确保表存在
initDatabase();

export const dynamic = "force-dynamic";

/** GET /api/projects — 获取所有项目（按 updatedAt 降序） */
export async function GET() {
  try {
    const allProjects = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.updatedAt));
    return NextResponse.json(allProjects);
  } catch (error) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }
}

/** POST /api/projects — 创建项目 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, description, createdAt, updatedAt } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "id and name are required" },
        { status: 400 },
      );
    }

    const now = new Date();
    await db.insert(projects).values({
      id,
      name,
      description: description ?? null,
      userId: "default-user",
      createdAt: createdAt ? new Date(createdAt).toISOString() : now.toISOString(),
      updatedAt: updatedAt ? new Date(updatedAt).toISOString() : now.toISOString(),
    });

    return NextResponse.json({ id, name, description, createdAt: createdAt || now.toISOString(), updatedAt: updatedAt || now.toISOString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }
}
