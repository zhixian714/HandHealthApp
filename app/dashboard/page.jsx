"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Building2, CircleUser, ChevronDown, Download, Calendar, Droplets, Syringe, ShieldCheck, Ruler } from "lucide-react";

// Add a new form type here and its card renders automatically alongside the others.
const FORM_TYPES = [
  {
    key: "HAND_HYGIENE",
    label: "手部衛生稽核",
    auditName: "手部衛生",
    icon: Droplets,
    summaryUrl: "/api/reports/summary",
    pdfUrl: "/api/reports/pdf",
    kind: "hand-hygiene",
  },
  {
    key: "SHARPS",
    label: "尖銳物安全使用及處置",
    auditName: "尖銳物",
    icon: Syringe,
    summaryUrl: "/api/reports/sharps/summary",
    pdfUrl: "/api/reports/sharps/pdf",
    kind: "checklist",
  },
  {
    key: "PPE",
    label: "個人防護裝備 (PPE)",
    auditName: "PPE",
    icon: ShieldCheck,
    summaryUrl: "/api/reports/ppe/summary",
    pdfUrl: "/api/reports/ppe/pdf",
    kind: "checklist-grouped",
  },
  {
    key: "BBE",
    label: "手肘以下淨空稽核",
    auditName: "BBE",
    icon: Ruler,
    summaryUrl: "/api/reports/bbe/summary",
    pdfUrl: "/api/reports/bbe/pdf",
    kind: "bbe",
  },
];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [clinics, setClinics] = useState([]);
  const [loadingClinics, setLoadingClinics] = useState(true);
  const [clinicId, setClinicId] = useState("");
  const [periodType, setPeriodType] = useState("month");
  const [period, setPeriod] = useState("");

  const [reports, setReports] = useState({});
  const [loadingKeys, setLoadingKeys] = useState({});
  const [downloadingKeys, setDownloadingKeys] = useState({});

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

  const handleClinicChange = (id) => {
    setClinicId(id);
    setPeriod("");
    setReports({});
  };

  useEffect(() => {
    if (!ready) {
      setReports({});
      return;
    }
    const params = new URLSearchParams({ clinicId, periodType, period });
    const initialLoading = {};
    FORM_TYPES.forEach((f) => (initialLoading[f.key] = true));
    setLoadingKeys(initialLoading);

    FORM_TYPES.forEach((f) => {
      fetch(`${f.summaryUrl}?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          setReports((prev) => ({ ...prev, [f.key]: data.error ? null : data }));
        })
        .finally(() => {
          setLoadingKeys((prev) => ({ ...prev, [f.key]: false }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, clinicId, periodType, period]);

  const monthOptions = ["2026-07", "2026-06", "2026-05", "2026-04"];
  const quarterOptions = ["2026-Q3", "2026-Q2", "2026-Q1"];

  const handleDownload = async (formType) => {
    if (!ready) return;
    setDownloadingKeys((prev) => ({ ...prev, [formType.key]: true }));
    try {
      const params = new URLSearchParams({ clinicId, periodType, period });
      const res = await fetch(`${formType.pdfUrl}?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "下載失敗，請稍後再試");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeClinicName = (selectedClinic?.name ?? "報表").replace(/[\\/:*?"<>|]/g, "");
      a.download = `${safeClinicName}_${period.replace("-", "_")}_${formType.auditName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("下載發生錯誤:", e);
      alert("發生錯誤，請稍後再試");
    } finally {
      setDownloadingKeys((prev) => ({ ...prev, [formType.key]: false }));
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

        <div className="px-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            診所 / 醫院
          </div>
          <div className="relative">
            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5B6B72" }} />
            <select
              value={clinicId}
              onChange={(e) => handleClinicChange(e.target.value)}
              disabled={loadingClinics}
              className="w-full appearance-none rounded-xl pl-9 pr-9 py-3 text-sm border"
              style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
            >
              <option value="">{loadingClinics ? "載入診所清單中..." : "請選擇診所或醫院"}</option>
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
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5B6B72" }} />
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

        {ready &&
          FORM_TYPES.map((f) => {
            const Icon = f.icon;
            const report = reports[f.key];
            const loading = loadingKeys[f.key];
            const downloading = downloadingKeys[f.key];

            return (
              <div key={f.key} className="px-5 mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={16} style={{ color: "#0E6E66" }} />
                  <span className="text-sm font-semibold">{f.label}</span>
                </div>

                {loading && (
                  <div
                    className="rounded-2xl p-5 text-center text-sm"
                    style={{ background: "#FFFFFF", border: "1px solid #DDE3E4", color: "#5B6B72" }}
                  >
                    統計資料載入中...
                  </div>
                )}

                {!loading && report && f.kind === "hand-hygiene" && (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="rounded-xl p-3" style={{ background: "#F5F7F8" }}>
                          <div className="text-xs" style={{ color: "#5B6B72" }}>
                            總稽核時機
                          </div>
                          <div className="num text-2xl mt-0.5" style={{ fontWeight: 700 }}>
                            {report.totalMoments}
                          </div>
                        </div>
                        <div className="rounded-xl p-3" style={{ background: "#EAF5F3" }}>
                          <div className="text-xs" style={{ color: "#0A4F49" }}>
                            整體遵從率
                          </div>
                          <div className="num text-2xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>
                            {report.complianceRate}%
                          </div>
                        </div>
                      </div>

                      {report.totalMoments === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>
                          這段期間還沒有任何稽核紀錄
                        </p>
                      ) : (
                        <>
                          <div className="mb-5">
                            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                              執行分佈
                            </div>
                            <div className="flex flex-col gap-2">
                              {report.activities.map((a) => (
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

                          {report.missByRole.length > 0 && (
                            <div className="mb-5">
                              <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                                未落實職類排行
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {report.missByRole.map((r) => (
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
                          )}

                          {report.missByMoment.length > 0 && (
                            <div>
                              <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                                未落實時機排行
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {report.missByMoment.map((m) => (
                                  <div key={m.no} className="flex items-center justify-between text-sm">
                                    <span>時機 {m.no}</span>
                                    <span className="mono" style={{ color: "#A63B33", fontWeight: 600 }}>
                                      {m.count}（{m.pct}%）
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-3"
                      style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700, opacity: downloading ? 0.6 : 1 }}
                    >
                      <Download size={16} />
                      {downloading ? "產生中..." : "下載 PDF 報表"}
                    </button>
                  </>
                )}

                {!loading && report && f.kind === "checklist" && (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
                      <div className="text-xs mb-4" style={{ color: "#5B6B72" }}>
                        總觀察數 {report.total}
                      </div>
                      {report.total === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>
                          這段期間還沒有任何觀察紀錄
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {report.questions.map((q) => (
                            <div key={q.key}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>{q.label}</span>
                                <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>
                                  {q.pct}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                                <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: "#0E6E66" }} />
                              </div>
                              <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>
                                YES {q.yesCount}　NO {q.noCount}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-3"
                      style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700, opacity: downloading ? 0.6 : 1 }}
                    >
                      <Download size={16} />
                      {downloading ? "產生中..." : "下載 PDF 報表"}
                    </button>
                  </>
                )}

                {!loading && report && f.kind === "checklist-grouped" && (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
                      <div className="text-xs mb-4" style={{ color: "#5B6B72" }}>
                        總觀察數 {report.total}
                      </div>
                      {report.total === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>
                          這段期間還沒有任何觀察紀錄
                        </p>
                      ) : (
                        ["暴露前", "暴露後"].map((group) => (
                          <div key={group} className="mb-5 last:mb-0">
                            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                              {group}
                            </div>
                            <div className="flex flex-col gap-3">
                              {report.questions
                                .filter((q) => q.group === group)
                                .map((q) => (
                                  <div key={q.key}>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span>{q.label}</span>
                                      <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>
                                        {q.pct}%
                                      </span>
                                    </div>
                                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                                      <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: "#0E6E66" }} />
                                    </div>
                                    <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>
                                      YES {q.yesCount}　NO {q.noCount}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-3"
                      style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700, opacity: downloading ? 0.6 : 1 }}
                    >
                      <Download size={16} />
                      {downloading ? "產生中..." : "下載 PDF 報表"}
                    </button>
                  </>
                )}
                {!loading && report && f.kind === "bbe" && (
                  <>
                    <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
                      <div className="rounded-xl p-3 mb-4" style={{ background: "#EAF5F3" }}>
                        <div className="text-xs" style={{ color: "#0A4F49" }}>
                          整體遵從率
                        </div>
                        <div className="num text-2xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>
                          {report.overallPct}%
                        </div>
                      </div>

                      {report.entryCount === 0 ? (
                        <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>
                          這段期間還沒有任何稽核紀錄
                        </p>
                      ) : (
                        <div className="flex flex-col gap-3">
                          {report.roles.map((r) => (
                            <div key={r.key}>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>{r.label}</span>
                                <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>
                                  {r.pct}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                                <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "#0E6E66" }} />
                              </div>
                              <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>
                                符合 {r.compliantTotal}／當班 {r.staffTotal}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDownload(f)}
                      disabled={downloading}
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm mt-3"
                      style={{ background: "#16242C", color: "#FFFFFF", fontWeight: 700, opacity: downloading ? 0.6 : 1 }}
                    >
                      <Download size={16} />
                      {downloading ? "產生中..." : "下載 PDF 報表"}
                    </button>
                  </>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
