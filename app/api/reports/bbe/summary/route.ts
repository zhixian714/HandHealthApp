import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getDateRange(periodType: "month" | "quarter", period: string) {
  if (periodType === "month") {
    const [year, month] = period.split("-").map(Number);
    return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) };
  }
  const [year, qLabel] = period.split("-");
  const quarter = Number(qLabel.replace("Q", ""));
  const startMonth = (quarter - 1) * 3;
  return {
    start: new Date(Date.UTC(Number(year), startMonth, 1)),
    end: new Date(Date.UTC(Number(year), startMonth + 3, 1)),
  };
}

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 1000) / 10;

const ROLES = [
  { key: "doctor", label: "醫師" },
  { key: "nurse", label: "護理人員" },
  { key: "cleaner", label: "清潔人員" },
] as const;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicId = searchParams.get("clinicId");
    const periodType = (searchParams.get("periodType") as "month" | "quarter") ?? "month";
    const period = searchParams.get("period");

    if (!clinicId || !period) {
      return NextResponse.json({ error: "缺少 clinicId 或 period 參數" }, { status: 400 });
    }

    const clinic = await prisma.clinic.findUnique({ where: { id: clinicId } });
    if (!clinic) {
      return NextResponse.json({ error: "找不到這間診所" }, { status: 404 });
    }

    const { start, end } = getDateRange(periodType, period);
    const observations = await prisma.bbeObservation.findMany({
      where: { clinicId, observedAt: { gte: start, lt: end } },
    });

    const entryCount = observations.length;

    const roles = ROLES.map((r) => {
      const staffTotal = observations.reduce((sum, o) => sum + (o as any)[`${r.key}StaffCount`], 0);
      const compliantTotal = observations.reduce((sum, o) => sum + (o as any)[`${r.key}CompliantCount`], 0);
      return { key: r.key, label: r.label, staffTotal, compliantTotal, pct: pct(compliantTotal, staffTotal) };
    });

    const overallStaff = roles.reduce((s, r) => s + r.staffTotal, 0);
    const overallCompliant = roles.reduce((s, r) => s + r.compliantTotal, 0);
    const overallPct = pct(overallCompliant, overallStaff);

    return NextResponse.json({ clinicName: clinic.name, entryCount, roles, overallPct });
  } catch (error) {
    console.error("[bbe summary] 發生錯誤:", error);
    return NextResponse.json({ error: "統計資料計算失敗" }, { status: 500 });
  }
}
