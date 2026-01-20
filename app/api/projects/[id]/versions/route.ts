// app/api/projects/[id]/versions/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// 获取项目所有版本
export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const versions = await prisma.version.findMany({
    where: { projectId: params.id },
    orderBy: { versionNum: "desc" },
    select: {
      id: true,
      versionNum: true,
      sketchImage: true, // 只返回缩略图
      requirements: true,
      createdAt: true,
    },
  });

  return NextResponse.json(versions);
}

// 保存新版本
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sketchData, sketchImage, generatedCode, requirements } =
    await req.json();

  // 获取最新版本号
  const lastVersion = await prisma.version.findFirst({
    where: { projectId: params.id },
    orderBy: { versionNum: "desc" },
  });

  const newVersionNum = (lastVersion?.versionNum || 0) + 1;

  const version = await prisma.version.create({
    data: {
      projectId: params.id,
      versionNum: newVersionNum,
      sketchData,
      sketchImage,
      generatedCode,
      requirements,
    },
  });

  // 更新项目更新时间
  await prisma.project.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json(version);
}
