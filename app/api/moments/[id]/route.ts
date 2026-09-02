import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// PATCH: edit an existing moment — only its own auditor may edit it
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const existing = await prisma.moment.findUnique({ where: { id: params.id } });
  if (!existing || existing.auditorId !== session.user.id) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  const body = await req.json();
  const { code, moment, activity, glove } = body;

  if (!code || !moment || !activity) {
    return NextResponse.json({ error: "缺少必填欄位" }, { status: 400 });
  }

  const staffCode = await prisma.staffCode.findUnique({ where: { code } });
  if (!staffCode) {
    return NextResponse.json({ error: "找不到這個職類代碼" }, { status: 400 });
  }

  const updated = await prisma.moment.update({
    where: { id: params.id },
    data: {
      momentNo: moment,
      activity,
      gloveStatus: glove ?? null,
      staffCodeId: staffCode.id,
    },
  });

  return NextResponse.json({ id: updated.id, code, moment, activity, glove: glove ?? null });
}

// DELETE: remove a moment — only its own auditor may delete it
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }

  const existing = await prisma.moment.findUnique({ where: { id: params.id } });
  if (!existing || existing.auditorId !== session.user.id) {
    return NextResponse.json({ error: "找不到這筆紀錄" }, { status: 404 });
  }

  await prisma.moment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
