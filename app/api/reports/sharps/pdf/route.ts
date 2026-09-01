import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
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

const sanitizeForFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "");

const QUESTIONS = [
  { key: "carriedToPointOfCare", label: "尖銳物攜至照護點使用" },
  { key: "noRecapping", label: "不回套" },
  { key: "needleNotOnSurface", label: "針頭不置於工作區表面" },
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
    const observations = await prisma.sharpsObservation.findMany({
      where: { clinicId, observedAt: { gte: start, lt: end } },
    });

    const total = observations.length;
    const questions = QUESTIONS.map((q) => {
      const yesCount = observations.filter((o) => o[q.key]).length;
      return { label: q.label, yesCount, noCount: total - yesCount, pct: pct(yesCount, total) };
    });

    const todayLabel = new Date().toISOString().slice(0, 10);
    const periodLabel =
      periodType === "month" ? `${period.slice(0, 4)}年${period.slice(5)}月` : `${period.slice(0, 4)}年${period.slice(5)}`;

    const html = `
      <html><head><meta charset="utf-8" />
      <style>
        * { box-sizing: border-box; }
        body { font-family: "Microsoft JhengHei", "PMingLiU", sans-serif; color: #16242C; padding: 40px; }
        h1 { font-size: 22px; margin: 0 0 6px 0; }
        .meta { color: #5B6B72; font-size: 12px; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #EEF1F1; text-align: left; }
        th { color: #5B6B72; font-weight: 600; font-size: 12px; }
        td.num { text-align: right; }
      </style></head>
      <body>
        <h1>尖銳物安全使用及處置稽核報表</h1>
        <div class="meta">產生日期：${todayLabel}　|　單位：${clinic.name}　|　期間：${periodLabel}　|　總觀察數：${total}</div>
        <table>
          <tr><th>稽核項目</th><th class="num">YES</th><th class="num">NO</th><th class="num">符合率</th></tr>
          ${questions
            .map(
              (q) =>
                `<tr><td>${q.label}</td><td class="num">${q.yesCount}</td><td class="num">${q.noCount}</td><td class="num">${q.pct}%</td></tr>`
            )
            .join("")}
        </table>
      </body></html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "a4", printBackground: true });
    await browser.close();

    const filePeriod = period.replace("-", "_");
    const fileName = `${sanitizeForFilename(clinic.name)}_${filePeriod}_尖銳物.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("[sharps pdf] 發生錯誤:", error);
    return NextResponse.json({ error: "PDF 產生失敗" }, { status: 500 });
  }
}
