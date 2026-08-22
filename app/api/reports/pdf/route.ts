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
// ---- 替換成具有 FRESENIUS 風格的報表排版 ----
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
                size: A4;
                margin: 20mm 15mm;
                background-color: #fdfbf7;
            }
            body {
                font-family: "Microsoft JhengHei", "PMingLiU", "Noto Sans TC", sans-serif;
                margin: 0;
                padding: 0;
                color: #333;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #2F75B5;
                padding-bottom: 10px;
                margin-bottom: 20px;
            }
            h1 { color: #2F75B5; margin: 0; font-size: 24pt; }
            .date { color: #666; font-size: 12pt; margin-top: 8px; }
            h2 {
                color: #333;
                border-left: 5px solid #2F75B5;
                padding-left: 10px;
                font-size: 16pt;
                margin-top: 30px;
            }
            .kpi-container {
                width: 100%;
                text-align: center;
                margin: 20px 0;
            }
            .kpi-box {
                display: inline-block;
                width: 45%;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 15px;
                margin: 0 2%;
                box-sizing: border-box;
            }
            .kpi-title { font-size: 14pt; color: #555; margin:0 0 10px 0; }
            .kpi-value { font-size: 24pt; font-weight: bold; color: #E84C3D; margin:0; }
            .kpi-value.green { color: #27AE60; }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
                background: #fff;
            }
            th, td {
                border: 1px solid #ccc;
                padding: 10px;
                text-align: center;
                font-size: 12pt;
            }
            th {
                background-color: #2F75B5;
                color: white;
                font-weight: bold;
            }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .miss-text { color: #E84C3D; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
              <h1>FRESENIUS MEDICAL CARE</h1>
              <h1>手部衛生稽核分析報表</h1>
              <div class="date">產生日期：${todayLabel} | 單位：${clinic.name} | 期間：${periodLabel}</div>
          </div>
          
          <div class="kpi-container">
              <div class="kpi-box">
                  <p class="kpi-title">總稽核時機 (Total Moments)</p>
                  <p class="kpi-value">${total}</p>
              </div>
              <div class="kpi-box">
                  <p class="kpi-title">整體遵從率 (Compliance Rate)</p>
                  <p class="kpi-value green">${complianceRate}%</p>
              </div>
          </div>

          <h2>一、時機點執行分佈 (Wash / Rub / Miss)</h2>
          <table>
            <tr>
                <th>活動別 (Action)</th>
                <th>筆數 (Count)</th>
                <th>佔比 (Percentage)</th>
            </tr>
            ${activities.map((a) => `
            <tr>
                <td>${a.label}</td>
                <td class="${a.label.includes('Miss') ? 'miss-text' : ''}">${a.count}</td>
                <td class="${a.label.includes('Miss') ? 'miss-text' : ''}">${a.pct}%</td>
            </tr>`).join("")}
          </table>

          <h2>二、未落實 (Miss) 職類排行榜</h2>
          <table>
            <tr>
                <th>職類代碼 (Role)</th>
                <th>Miss 數量</th>
                <th>佔總 Miss 比例</th>
            </tr>
            ${missByRole.length ? missByRole.map((r) => `
            <tr>
                <td>${r.code}（${r.label}）</td>
                <td>${r.count}</td>
                <td>${r.pct}%</td>
            </tr>`).join("") : `<tr><td colspan="3" style="color:#5B6B72;">此期間無未落實紀錄</td></tr>`}
          </table>

          <h2>三、未落實 (Miss) 時機排行榜</h2>
          <table>
            <tr>
                <th>時機別 (Moment 1-5)</th>
                <th>Miss 數量</th>
                <th>佔總 Miss 比例</th>
            </tr>
            ${missByMoment.length ? missByMoment.map((m) => `
            <tr>
                <td>時機 ${m.no}</td>
                <td>${m.count}</td>
                <td>${m.pct}%</td>
            </tr>`).join("") : `<tr><td colspan="3" style="color:#5B6B72;">此期間無未落實紀錄</td></tr>`}
          </table>
        </body>
      </html>
    `;

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBuffer = await page.pdf({ format: "a4", printBackground: true });
    await browser.close();

    // filename: 診所_年_月.pdf (or 診所_年_Q季.pdf for quarterly reports)
    const filePeriod = periodType === "month" ? period.replace("-", "_") : period.replace("-", "_");
    const fileName = `${sanitizeForFilename(clinic.name)}_${filePeriod}.pdf`;

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
