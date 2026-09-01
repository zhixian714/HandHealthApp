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

const QUESTIONS = [
  { key: "maskWorn", label: "配戴口罩", group: "暴露前" },
  { key: "gownWorn", label: "穿圍裙或隔離衣", group: "暴露前" },
  { key: "glovesWorn", label: "戴手套", group: "暴露前" },
  { key: "gownRemovedBeforeNextPatient", label: "接觸下一位病患前移除圍裙/隔離衣", group: "暴露後" },
  { key: "glovesRemovedAfterProcedure", label: "執行程序後立即移除手套", group: "暴露後" },
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
    const observations = await prisma.ppeObservation.findMany({
      where: { clinicId, observedAt: { gte: start, lt: end } },
    });

    const total = observations.length;
    const questions = QUESTIONS.map((q) => {
      const yesCount = observations.filter((o) => o[q.key]).length;
      return {
        key: q.key,
        label: q.label,
        group: q.group,
        yesCount,
        noCount: total - yesCount,
        pct: pct(yesCount, total),
      };
    });

    return NextResponse.json({ clinicName: clinic.name, total, questions });
  } catch (error) {
    console.error("[ppe summary] 發生錯誤:", error);
    return NextResponse.json({ error: "統計資料計算失敗" }, { status: 500 });
  }
}
