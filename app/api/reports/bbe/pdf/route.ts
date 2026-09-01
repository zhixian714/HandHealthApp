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

    const roles = ROLES.map((r) => {
      const staffTotal = observations.reduce((sum, o) => sum + (o as any)[`${r.key}StaffCount`], 0);
      const compliantTotal = observations.reduce((sum, o) => sum + (o as any)[`${r.key}CompliantCount`], 0);
      return { label: r.label, staffTotal, compliantTotal, pct: pct(compliantTotal, staffTotal) };
    });
    const overallStaff = roles.reduce((s, r) => s + r.staffTotal, 0);
    const overallCompliant = roles.reduce((s, r) => s + r.compliantTotal, 0);
    const overallPct = pct(overallCompliant, overallStaff);

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
        .headline { border-radius: 10px; padding: 14px 16px; background: #EAF5F3; color: #0A4F49; margin-bottom: 20px; width: 260px; }
        .headline .label { font-size: 12px; }
        .headline .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }
        th, td { padding: 8px 6px; border-bottom: 1px solid #EEF1F1; text-align: left; }
        th { color: #5B6B72; font-weight: 600; font-size: 12px; }
        td.num { text-align: right; }
      </style></head>
      <body>
        <h1>手肘以下淨空稽核報表</h1>
        <div class="meta">產生日期：${todayLabel}　|　單位：${clinic.name}　|　期間：${periodLabel}</div>

        <div class="headline">
          <div class="label">整體遵從率 (Overall Compliance)</div>
          <div class="value">${overallPct}%</div>
        </div>

        <table>
          <tr><th>人員類別</th><th class="num">當班人數</th><th class="num">符合人數</th><th class="num">遵從率</th></tr>
          ${roles
            .map(
              (r) =>
                `<tr><td>${r.label}</td><td class="num">${r.staffTotal}</td><td class="num">${r.compliantTotal}</td><td class="num">${r.pct}%</td></tr>`
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
    const fileName = `${sanitizeForFilename(clinic.name)}_${filePeriod}_BBE.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("[bbe pdf] 發生錯誤:", error);
    return NextResponse.json({ error: "PDF 產生失敗" }, { status: 500 });
  }
}
