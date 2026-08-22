"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, CircleUser, ChevronDown, Download, Calendar } from "lucide-react";

// ---- mock report numbers — the summary card itself still uses placeholder data      ----
// ---- (wiring this to a real /api/reports endpoint is a separate next step)          ----
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
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [clinicId, setClinicId] = useState("");
  const [periodType, setPeriodType] = useState("month");
  const [period, setPeriod] = useState("");
  const [downloading, setDownloading] = useState(false);

  // block anyone who isn't SUPER_ADMIN / REGION_ADMIN from seeing this page
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "SUPER_ADMIN" && session.user.role !== "REGION_ADMIN") {
      router.push("/audit");
    }
  }, [session, status, router]);

  // fetch the clinic list this logged-in person is actually allowed to see
  useEffect(() => {
    if (status !== "authenticated") return;
    setLoadingClinics(true);
    fetch("/api/clinics")
      .then((res) => res.json())
      .then((data) => setClinics(data.clinics ?? []))
      .finally(() => setLoadingClinics(false));
  }, [status]);

  const ready = Boolean(clinicId && period);
  const selectedClinic = clinics.find((c) => c.id === clinicId);

  const monthOptions = ["2026-07", "2026-06", "2026-05", "2026-04"];
  const quarterOptions = ["2026-Q3", "2026-Q2", "2026-Q1"];

  const handleDownload = async () => {
    if (!ready) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams({ clinicId, periodType, period });
      const res = await fetch(`/api/reports/pdf?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "下載失敗，請稍後再試");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // build the same filename convention the server uses: 診所_年_月.pdf
      const safeClinicName = (selectedClinic?.name ?? "報表").replace(/[\\/:*?"<>|]/g, "");
      a.download = `${safeClinicName}_${period.replace("-", "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("下載發生錯誤:", e);
      alert("發生錯誤，請稍後再試");
    } finally {
      setDownloading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F5F7F8" }}>
        <span style={{ color: "#5B6B72" }}>載入中...</span>
      </div>
    );
  }

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
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              稽核統計報表
            </h1>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#5B6B72" }}>
              <CircleUser size={15} />
              <span>{session?.user?.name}</span>
            </div>
          </div>
        </div>

        {/* step 1: pick a clinic — options now come from /api/clinics based on role */}
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
              value={clinicId}
              onChange={(e) => setClinicId(e.target.value)}
              disabled={loadingClinics}
              className="w-full appearance-none rounded-xl pl-9 pr-9 py-3 text-sm border"
              style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
            >
              <option value="">
                {loadingClinics ? "載入診所清單中..." : "請選擇診所或醫院"}
              </option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "#5B6B72" }}
            />
          </div>
          {!loadingClinics && clinics.length === 0 && (
            <p className="text-xs mt-2" style={{ color: "#A63B33" }}>
              目前沒有任何可查看的診所，請聯繫系統管理員確認權限設定。
            </p>
          )}
        </div>

        {clinicId && (
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
                <option value="">{periodType === "month" ? "請選擇月份" : "請選擇季度"}</option>
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

        {ready && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold">{selectedClinic?.name}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                    {period}（{periodType === "month" ? "月報" : "季報"}）
                  </div>
                </div>
              </div>

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

              <div className="mb-5">
                <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                  執行分佈
                </div>
                <div className="flex flex-col gap-2">
                  {MOCK_REPORT.activities.map((a) => (
                    <div key={a.key} className="flex items-center gap-2">
                      <span className="text-xs w-20 shrink-0">{a.label}</span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                        <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: a.color }} />
                      </div>
                      <span className="mono text-xs w-16 text-right shrink-0" style={{ color: "#5B6B72" }}>
                        {a.count}（{a.pct}%）
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-4"
              style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700, opacity: downloading ? 0.6 : 1 }}
            >
              <Download size={16} />
              {downloading ? "產生中..." : "下載 PDF 報表"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
