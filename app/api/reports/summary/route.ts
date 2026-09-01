import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getDateRange(periodType: "month" | "quarter", period: string) {
  if (periodType === "month") {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { start, end };
  }
  const [year, qLabel] = period.split("-");
  const quarter = Number(qLabel.replace("Q", ""));
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(Number(year), startMonth, 1));
  const end = new Date(Date.UTC(Number(year), startMonth + 3, 1));
  return { start, end };
}

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 1000) / 10;

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

    const moments = await prisma.moment.findMany({
      where: { clinicId, createdAt: { gte: start, lt: end } },
      include: { staffCode: true },
    });

    const totalMoments = moments.length;

    const activityCounts = { RUB: 0, WASH: 0, MISS: 0 } as Record<string, number>;
    moments.forEach((m) => activityCounts[m.activity]++);
    const activities = [
      { key: "RUB", label: "酒精乾洗手", count: activityCounts.RUB, pct: pct(activityCounts.RUB, totalMoments), color: "#B8842B" },
      { key: "WASH", label: "濕洗手", count: activityCounts.WASH, pct: pct(activityCounts.WASH, totalMoments), color: "#2B5FA6" },
      { key: "MISS", label: "未落實", count: activityCounts.MISS, pct: pct(activityCounts.MISS, totalMoments), color: "#A63B33" },
    ];
    const complianceRate = pct(activityCounts.RUB + activityCounts.WASH, totalMoments);

    const missMoments = moments.filter((m) => m.activity === "MISS");
    const missTotal = missMoments.length;
    const roleCounts = new Map<string, { label: string; count: number }>();
    missMoments.forEach((m) => {
      const key = m.staffCode.code;
      const prev = roleCounts.get(key) ?? { label: m.staffCode.description, count: 0 };
      prev.count++;
      roleCounts.set(key, prev);
    });
    const missByRole = [...roleCounts.entries()]
      .map(([code, v]) => ({ code, label: v.label, count: v.count, pct: pct(v.count, missTotal) }))
      .sort((a, b) => b.count - a.count);

    const momentCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>;
    missMoments.forEach((m) => momentCounts[m.momentNo]++);
    const missByMoment = Object.entries(momentCounts)
      .map(([no, count]) => ({ no: Number(no), count, pct: pct(count, missTotal) }))
      .sort((a, b) => b.count - a.count);

    return NextResponse.json({
      clinicName: clinic.name,
      totalMoments,
      complianceRate,
      activities,
      missByRole,
      missByMoment,
    });
  } catch (error) {
    console.error("[summary] 發生錯誤:", error);
    return NextResponse.json(
      { error: "統計資料計算失敗", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
