import { NextResponse } from "next/server";
import { db } from "@/lib/server-db";
import { projects } from "@/lib/server-db/schema";
import { desc, eq } from "drizzle-orm";
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

export async function GET() {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    const allProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
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

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

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
      userId: user.id,
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