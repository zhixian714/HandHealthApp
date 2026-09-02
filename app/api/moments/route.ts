import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// find today's audit session for this auditor at their clinic, creating one if it doesn't exist yet
async function getOrCreateTodaySession(clinicId: string, auditorId: string) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const existing = await prisma.auditSession.findFirst({
    where: { clinicId, auditorId, date: { gte: todayStart, lt: todayEnd } },
  });
  if (existing) return existing;

  return prisma.auditSession.create({
    data: { clinicId, auditorId, date: new Date(), startTime: new Date() },
  });
}

// GET: today's moments for the logged-in auditor, so the "最近登記" list survives a page refresh
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  const clinicId = session.user.clinicId;
  if (!clinicId) {
    return NextResponse.json({ error: "此帳號尚未綁定診所" }, { status: 400 });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const moments = await prisma.moment.findMany({
    where: { clinicId, auditorId: session.user.id, createdAt: { gte: todayStart, lt: todayEnd } },
    include: { staffCode: true },
    orderBy: { createdAt: "desc" },
  });

  const entries = moments.map((m) => ({
    id: m.id,
    code: m.staffCode.code,
    moment: m.momentNo,
    activity: m.activity,
    glove: m.gloveStatus,
  }));

  return NextResponse.json({ entries });
}

// POST: create a new moment entry
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "AUDITOR") {
    return NextResponse.json({ error: "未授權" }, { status: 401 });
  }
  const clinicId = session.user.clinicId;
  if (!clinicId) {
    return NextResponse.json({ error: "此帳號尚未綁定診所" }, { status: 400 });
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

  const auditSession = await getOrCreateTodaySession(clinicId, session.user.id);

  const created = await prisma.moment.create({
    data: {
      momentNo: moment,
      activity,
      gloveStatus: glove ?? null,
      staffCodeId: staffCode.id,
      clinicId,
      auditorId: session.user.id,
      sessionId: auditSession.id,
    },
  });

  return NextResponse.json({ id: created.id, code, moment, activity, glove: glove ?? null });
}
