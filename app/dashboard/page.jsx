"use client";

import { useState } from "react";
import { Building2, CircleUser, ChevronDown, Download, Calendar } from "lucide-react";

// ---- mock data — real version will come from the session (role/org/clinic) + an API call ----
const MOCK_CLINICS = [
  "天成醫院", "天晟醫院", "禾安診所", "百齡診所", "佳禾診所", "佳佑診所", "佳晟診所",
];

const MOCK_REPORT = {
  totalMoments: 150,
  complianceRate: 78.7,
  activities: [
    { key: "RUB", label: "酒精乾洗手", count: 83, pct: 55.3, color: "#B8842B" },
    { key: "WASH", label: "濕洗手", count: 35, pct: 23.3, color: "#2B5FA6" },
    { key: "MISS", label: "未落實", count: 32, pct: 21.3, color: "#A63B33" },
  ],
  missByRole: [
    { code: "N", label: "護理師", count: 17, pct: 53.1 },
    { code: "DR", label: "醫師", count: 9, pct: 28.1 },
    { code: "PC", label: "病房助理", count: 3, pct: 9.4 },
    { code: "BL", label: "透析技術員", count: 3, pct: 9.4 },
  ],
  missByMoment: [
    { no: 4, count: 11, pct: 34.4 },
    { no: 3, count: 9, pct: 28.1 },
    { no: 2, count: 6, pct: 18.8 },
    { no: 1, count: 4, pct: 12.5 },
    { no: 5, count: 2, pct: 6.3 },
  ],
};

export default function Dashboard() {
  const [clinic, setClinic] = useState("");
  const [periodType, setPeriodType] = useState("month"); // "month" | "quarter"
  const [period, setPeriod] = useState("");

  const ready = Boolean(clinic && period);

  // for the month/quarter picker options — real version should derive from data available in DB
  const monthOptions = ["2026-07", "2026-06", "2026-05", "2026-04"];
  const quarterOptions = ["2026-Q3", "2026-Q2", "2026-Q1"];

  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#F5F7F8" }}
      className="min-h-screen w-full flex justify-center"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Barlow+Condensed:wght@600;700&display=swap');
        .num { font-family:'Barlow Condensed',sans-serif; }
        .mono { font-family:'IBM Plex Mono',monospace; }
      `}</style>

      <div className="w-full max-w-md pb-16" style={{ color: "#16242C" }}>
        {/* top bar */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              稽核統計報表
            </h1>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#5B6B72" }}>
              <CircleUser size={15} />
              <span>督導 A</span>
            </div>
          </div>
        </div>

        {/* step 1: pick a clinic */}
        <div className="px-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            診所 / 醫院
          </div>
          <div className="relative">
            <Building2
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "#5B6B72" }}
            />
            <select
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
              className="w-full appearance-none rounded-xl pl-9 pr-9 py-3 text-sm border"
              style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
            >
              <option value="">請選擇診所或醫院</option>
              {MOCK_CLINICS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#5B6B72" }}
            />
          </div>
        </div>

        {/* step 2: month / quarter toggle + period picker */}
        {clinic && (
          <div className="px-5 mt-5">
            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
              統計區間
            </div>
            <div className="flex gap-2 mb-2">
              {[
                { key: "month", label: "月報" },
                { key: "quarter", label: "季報" },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setPeriodType(t.key);
                    setPeriod("");
                  }}
                  className="flex-1 rounded-lg py-2 text-sm border"
                  style={{
                    borderColor: periodType === t.key ? "#0E6E66" : "#DDE3E4",
                    background: periodType === t.key ? "#0E6E66" : "#FFFFFF",
                    color: periodType === t.key ? "#FFFFFF" : "#16242C",
                    fontWeight: 600,
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Calendar
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "#5B6B72" }}
              />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none rounded-xl pl-9 pr-9 py-3 text-sm border"
                style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
              >
                <option value="">
                  {periodType === "month" ? "請選擇月份" : "請選擇季度"}
                </option>
                {(periodType === "month" ? monthOptions : quarterOptions).map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={16}
                className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "#5B6B72" }}
              />
            </div>
          </div>
        )}

        {/* summary card — only shows once both selections are made */}
        {ready && (
          <div className="px-5 mt-6">
            <div
              className="rounded-2xl p-5"
              style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold">{clinic}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                    {period}（{periodType === "month" ? "月報" : "季報"}）
                  </div>
                </div>
              </div>

              {/* headline numbers */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl p-3" style={{ background: "#F5F7F8" }}>
                  <div className="text-xs" style={{ color: "#5B6B72" }}>
                    總稽核時機
                  </div>
                  <div className="num text-2xl mt-0.5" style={{ fontWeight: 700 }}>
                    {MOCK_REPORT.totalMoments}
                  </div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#EAF5F3" }}>
                  <div className="text-xs" style={{ color: "#0A4F49" }}>
                    整體遵從率
                  </div>
                  <div className="num text-2xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>
                    {MOCK_REPORT.complianceRate}%
                  </div>
                </div>
              </div>

              {/* activity breakdown, with percentages */}
              <div className="mb-5">
                <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                  執行分佈
                </div>
                <div className="flex flex-col gap-2">
                  {MOCK_REPORT.activities.map((a) => (
                    <div key={a.key} className="flex items-center gap-2">
                      <span className="text-xs w-20 shrink-0">{a.label}</span>
                      <div
                        className="flex-1 h-2 rounded-full overflow-hidden"
                        style={{ background: "#F1F4F4" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${a.pct}%`, background: a.color }}
                        />
                      </div>
                      <span className="mono text-xs w-16 text-right shrink-0" style={{ color: "#5B6B72" }}>
                        {a.count}（{a.pct}%）
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* miss by role, with percentages */}
              <div className="mb-5">
                <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                  未落實職類排行
                </div>
                <div className="flex flex-col gap-1.5">
                  {MOCK_REPORT.missByRole.map((r) => (
                    <div key={r.code} className="flex items-center justify-between text-sm">
                      <span>
                        <span className="mono font-semibold">{r.code}</span>{" "}
                        <span style={{ color: "#5B6B72" }}>{r.label}</span>
                      </span>
                      <span className="mono" style={{ color: "#A63B33", fontWeight: 600 }}>
                        {r.count}（{r.pct}%）
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* miss by moment, with percentages */}
              <div>
                <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                  未落實時機排行
                </div>
                <div className="flex flex-col gap-1.5">
                  {MOCK_REPORT.missByMoment.map((m) => (
                    <div key={m.no} className="flex items-center justify-between text-sm">
                      <span>時機 {m.no}</span>
                      <span className="mono" style={{ color: "#A63B33", fontWeight: 600 }}>
                        {m.count}（{m.pct}%）
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* download button */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-4"
              style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700 }}
            >
              <Download size={16} />
              下載 PDF 報表
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
