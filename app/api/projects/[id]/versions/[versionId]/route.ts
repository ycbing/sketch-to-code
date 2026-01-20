// app/api/projects/[id]/versions/[versionId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// 获取特定版本详情
export async function GET(
  req: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  const version = await prisma.version.findUnique({
    where: { id: params.versionId },
  });

  if (!version) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(version);
}

// 删除版本
export async function DELETE(
  req: Request,
  { params }: { params: { id: string; versionId: string } }
) {
  await prisma.version.delete({
    where: { id: params.versionId },
  });

  return NextResponse.json({ success: true });
}
