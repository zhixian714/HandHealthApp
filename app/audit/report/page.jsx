"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronDown, Download, Calendar, Droplets, Syringe, ShieldCheck, Ruler } from "lucide-react";

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

const monthOptions = ["2026-07", "2026-06", "2026-05", "2026-04"];

export default function AuditReportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formType, setFormType] = useState("HAND_HYGIENE");
  const [period, setPeriod] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const activeForm = FORM_TYPES.find((f) => f.key === formType);
  const clinicId = session?.user?.clinicId;
  const ready = Boolean(clinicId && period);

  // only auditors (with a clinic) belong on this page
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    if (session.user.role !== "AUDITOR") {
      router.push("/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!ready) {
      setReport(null);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams({ clinicId, periodType: "month", period });
    fetch(`${activeForm.summaryUrl}?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setReport(data.error ? null : data))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, clinicId, period, formType]);

  const handleFormTypeChange = (key) => {
    setFormType(key);
    setPeriod("");
    setReport(null);
  };

  const handleDownload = async () => {
    if (!ready) return;
    setDownloading(true);
    try {
      const params = new URLSearchParams({ clinicId, periodType: "month", period });
      const res = await fetch(`${activeForm.pdfUrl}?${params.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "下載失敗，請稍後再試");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeClinicName = (session?.user?.clinicName ?? "報表").replace(/[\\/:*?"<>|]/g, "");
      a.download = `${safeClinicName}_${period.replace("-", "_")}_${activeForm.auditName}.pdf`;
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
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#F5F7F8" }} className="min-h-screen w-full flex justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Barlow+Condensed:wght@600;700&display=swap');
        .num { font-family:'Barlow Condensed',sans-serif; }
        .mono { font-family:'IBM Plex Mono',monospace; }
      `}</style>

      <div className="w-full max-w-md pb-16" style={{ color: "#16242C" }}>
        <div className="px-5 pt-5 pb-4">
          <Link href="/audit" className="flex items-center gap-1 text-sm mb-2" style={{ color: "#5B6B72" }}>
            <ChevronLeft size={16} /> 返回稽核首頁
          </Link>
          <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
            稽核月報
          </h1>
          <p className="text-xs mt-1" style={{ color: "#5B6B72" }}>
            {session?.user?.clinicName}
          </p>
        </div>

        <div className="px-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            稽核表類型
          </div>
          <div className="relative">
            <select
              value={formType}
              onChange={(e) => handleFormTypeChange(e.target.value)}
              className="w-full appearance-none rounded-xl px-3 pr-9 py-3 text-sm border"
              style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
            >
              {FORM_TYPES.map((f) => (
                <option key={f.key} value={f.key}>
                  {f.label}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#5B6B72" }} />
          </div>
        </div>

        <div className="px-5 mt-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            月份
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "#5B6B72" }} />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full appearance-none rounded-xl pl-9 pr-9 py-3 text-sm border"
              style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
            >
              <option value="">請選擇月份</option>
              {monthOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#5B6B72" }} />
          </div>
        </div>

        {ready && loading && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5 text-center text-sm" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4", color: "#5B6B72" }}>
              統計資料載入中...
            </div>
          </div>
        )}

        {ready && !loading && report && formType === "HAND_HYGIENE" && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-xl p-3" style={{ background: "#F5F7F8" }}>
                  <div className="text-xs" style={{ color: "#5B6B72" }}>總稽核時機</div>
                  <div className="num text-2xl mt-0.5" style={{ fontWeight: 700 }}>{report.totalMoments}</div>
                </div>
                <div className="rounded-xl p-3" style={{ background: "#EAF5F3" }}>
                  <div className="text-xs" style={{ color: "#0A4F49" }}>整體遵從率</div>
                  <div className="num text-2xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>{report.complianceRate}%</div>
                </div>
              </div>

              {report.totalMoments === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>這段期間還沒有任何稽核紀錄</p>
              ) : (
                <>
                  <div className="mb-5">
                    <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>執行分佈</div>
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
                      <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>未落實職類排行</div>
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
                      <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>未落實時機排行</div>
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

        {ready && !loading && report && formType === "SHARPS" && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="text-xs mb-4" style={{ color: "#5B6B72" }}>總觀察數 {report.total}</div>
              {report.total === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>這段期間還沒有任何觀察紀錄</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {report.questions.map((q) => (
                    <div key={q.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{q.label}</span>
                        <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>{q.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                        <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: "#0E6E66" }} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>YES {q.yesCount}　NO {q.noCount}</div>
                    </div>
                  ))}
                </div>
              )}
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

        {ready && !loading && report && formType === "PPE" && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="text-xs mb-4" style={{ color: "#5B6B72" }}>總觀察數 {report.total}</div>
              {report.total === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>這段期間還沒有任何觀察紀錄</p>
              ) : (
                ["暴露前", "暴露後"].map((group) => (
                  <div key={group} className="mb-5 last:mb-0">
                    <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>{group}</div>
                    <div className="flex flex-col gap-3">
                      {report.questions.filter((q) => q.group === group).map((q) => (
                        <div key={q.key}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>{q.label}</span>
                            <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>{q.pct}%</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                            <div className="h-full rounded-full" style={{ width: `${q.pct}%`, background: "#0E6E66" }} />
                          </div>
                          <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>YES {q.yesCount}　NO {q.noCount}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
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

        {ready && !loading && report && formType === "BBE" && (
          <div className="px-5 mt-6">
            <div className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="rounded-xl p-3 mb-4" style={{ background: "#EAF5F3" }}>
                <div className="text-xs" style={{ color: "#0A4F49" }}>整體遵從率</div>
                <div className="num text-2xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>{report.overallPct}%</div>
              </div>
              {report.entryCount === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: "#5B6B72" }}>這段期間還沒有任何稽核紀錄</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {report.roles.map((r) => (
                    <div key={r.key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>{r.label}</span>
                        <span className="mono" style={{ color: "#0E6E66", fontWeight: 600 }}>{r.pct}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#F1F4F4" }}>
                        <div className="h-full rounded-full" style={{ width: `${r.pct}%`, background: "#0E6E66" }} />
                      </div>
                      <div className="text-xs mt-1" style={{ color: "#5B6B72" }}>符合 {r.compliantTotal}／當班 {r.staffTotal}</div>
                    </div>
                  ))}
                </div>
              )}
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
