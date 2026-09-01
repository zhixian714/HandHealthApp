import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { prisma } from "@/lib/prisma";

function getDateRange(periodType: "month" | "quarter", period: string) {
  if (periodType === "month") {
    const [year, month] = period.split("-").map(Number);
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { start, end, periodLabel: `${year}年${String(month).padStart(2, "0")}月` };
  }
  const [year, qLabel] = period.split("-");
  const quarter = Number(qLabel.replace("Q", ""));
  const startMonth = (quarter - 1) * 3;
  const start = new Date(Date.UTC(Number(year), startMonth, 1));
  const end = new Date(Date.UTC(Number(year), startMonth + 3, 1));
  return { start, end, periodLabel: `${year}年${qLabel}` };
}

const pct = (part: number, total: number) =>
  total === 0 ? 0 : Math.round((part / total) * 1000) / 10;

// clinic/org names are safe to use in a filename, but strip anything a filesystem might choke on
const sanitizeForFilename = (name: string) => name.replace(/[\\/:*?"<>|]/g, "");

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

    const { start, end, periodLabel } = getDateRange(periodType, period);

    const moments = await prisma.moment.findMany({
      where: { clinicId, createdAt: { gte: start, lt: end } },
      include: { staffCode: true },
    });

    const total = moments.length;

    const activityCounts = { RUB: 0, WASH: 0, MISS: 0 } as Record<string, number>;
    moments.forEach((m) => activityCounts[m.activity]++);
    const activities = [
      { label: "酒精乾洗手 (Rub)", count: activityCounts.RUB, pct: pct(activityCounts.RUB, total) },
      { label: "濕洗手 (Wash)", count: activityCounts.WASH, pct: pct(activityCounts.WASH, total) },
      { label: "未落實 (Miss)", count: activityCounts.MISS, pct: pct(activityCounts.MISS, total) },
    ];
    const complianceRate = pct(activityCounts.RUB + activityCounts.WASH, total);

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

    const todayLabel = new Date().toISOString().slice(0, 10);

    // ---- build the report as plain HTML/CSS, let Chromium's own text engine handle the Chinese glyphs ----
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: "Microsoft JhengHei", "PMingLiU", "Noto Sans TC", sans-serif;
              color: #16242C;
              padding: 40px;
            }
            h1 { font-size: 22px; margin: 0 0 6px 0; }
            .meta { color: #5B6B72; font-size: 12px; margin-bottom: 24px; }
            .headline { display: flex; gap: 16px; margin-bottom: 28px; }
            .headline .box {
              flex: 1; border-radius: 10px; padding: 14px 16px; background: #F5F7F8;
            }
            .headline .box.rate { background: #EAF5F3; color: #0A4F49; }
            .headline .label { font-size: 12px; color: #5B6B72; }
            .headline .box.rate .label { color: #0A4F49; }
            .headline .value { font-size: 24px; font-weight: 700; margin-top: 4px; }
            h2 { font-size: 15px; margin: 24px 0 10px 0; border-left: 4px solid #0E6E66; padding-left: 8px; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            td { padding: 6px 4px; border-bottom: 1px solid #EEF1F1; }
            td.num { text-align: right; }
            .miss td.num { color: #A63B33; font-weight: 600; }
          </style>
        </head>
        <body>
          <h1>手部衛生稽核分析報表</h1>
          <div class="meta">產生日期：${todayLabel}　|　單位：${clinic.name}　|　期間：${periodLabel}</div>

          <div class="headline">
            <div class="box">
              <div class="label">總稽核時機 (Total Moments)</div>
              <div class="value">${total}</div>
            </div>
            <div class="box rate">
              <div class="label">整體遵從率 (Compliance Rate)</div>
              <div class="value">${complianceRate}%</div>
            </div>
          </div>

          <h2>一、時機點執行分佈 (Wash / Rub / Miss)</h2>
          <table>
            ${activities
              .map(
                (a) => `<tr><td>${a.label}</td><td class="num">${a.count} 筆（${a.pct}%）</td></tr>`
              )
              .join("")}
          </table>

          <h2>二、未落實 (Miss) 職類排行榜</h2>
          <table class="miss">
            ${
              missByRole.length
                ? missByRole
                    .map(
                      (r) =>
                        `<tr><td>${r.code}（${r.label}）</td><td class="num">${r.count} 次（${r.pct}%）</td></tr>`
                    )
                    .join("")
                : `<tr><td colspan="2" style="color:#5B6B72;">此期間無未落實紀錄</td></tr>`
            }
          </table>

          <h2>三、未落實 (Miss) 時機排行榜</h2>
          <table class="miss">
            ${
              missByMoment.length
                ? missByMoment
                    .map((m) => `<tr><td>時機 ${m.no}</td><td class="num">${m.count} 次（${m.pct}%）</td></tr>`)
                    .join("")
                : `<tr><td colspan="2" style="color:#5B6B72;">此期間無未落實紀錄</td></tr>`
            }
          </table>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "a4", printBackground: true });
    await browser.close();

    // filename: 診所_年_月_稽核名稱.pdf
    const filePeriod = period.replace("-", "_");
    const fileName = `${sanitizeForFilename(clinic.name)}_${filePeriod}_手部衛生.pdf`;

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error("[pdf] 發生錯誤:", error);
    return NextResponse.json(
      { error: "PDF 產生失敗", detail: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
