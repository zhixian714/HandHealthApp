import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "未登入" }, { status: 401 });
  }

  const { role, organizationId } = session.user;

  // SUPER_ADMIN 看全部診所,包含尚未分配督導的
  if (role === "SUPER_ADMIN") {
    const clinics = await prisma.clinic.findMany({
      orderBy: { name: "asc" },
      include: { organization: true },
    });
    return NextResponse.json({ clinics });
  }

  // REGION_ADMIN 只看自己管理單位底下的診所
  if (role === "REGION_ADMIN") {
    if (!organizationId) {
      return NextResponse.json({ clinics: [] });
    }
    const clinics = await prisma.clinic.findMany({
      where: { organizationId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ clinics });
  }

  // AUDITOR 或其他角色不該呼叫這支 API,保險起見回空清單
  return NextResponse.json({ clinics: [] });
}
