"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, CircleUser, Calendar, ClipboardList, FileBarChart, Droplets } from "lucide-react";

export default function AuditHome() {
  const { data: session, status } = useSession();
  const [monthlyCount, setMonthlyCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const todayLabel = new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });
  const currentMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  // pulls the real cumulative count from the database — will read 0 until
  // audit form submissions are actually wired up to write to the database
  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.clinicId) return;
    setLoadingCount(true);
    const params = new URLSearchParams({
      clinicId: session.user.clinicId,
      periodType: "month",
      period: currentMonth,
    });
    fetch(`/api/reports/summary?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setMonthlyCount(data.error ? null : data.totalMoments))
      .finally(() => setLoadingCount(false));
  }, [status, session, currentMonth]);

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#F5F7F8" }} className="min-h-screen w-full flex justify-center">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&family=Barlow+Condensed:wght@600;700&display=swap');
        .num { font-family:'Barlow Condensed',sans-serif; }
        .mono { font-family:'IBM Plex Mono',monospace; }
      `}</style>

      <div className="w-full max-w-md" style={{ color: "#16242C" }}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6B72" }}>
              <Building2 size={15} />
              <span>{session?.user?.clinicName ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6B72" }}>
              <Calendar size={15} />
              <span className="mono">{todayLabel}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              感控稽核
            </h1>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#5B6B72" }}>
              <CircleUser size={15} />
              <span>{session?.user?.name}</span>
            </div>
          </div>
        </div>

        {/* monthly hand hygiene cumulative count — pulls from the real database */}
        <div className="px-5">
          <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "#bce5f1", border: "1px solid #CDE7E3" }}>
            <span
              className="flex items-center justify-center rounded-xl shrink-0"
              style={{ width: 40, height: 40, background: "#0E6E66", color: "#FFFFFF" }}
            >
              <Droplets size={18} />
            </span>
            <div>
              <div className="text-xs" style={{ color: "#0A4F49" }}>
                本月手部衛生稽核累計
              </div>
              <div className="num text-xl mt-0.5" style={{ fontWeight: 700, color: "#0A4F49" }}>
                {loadingCount ? "..." : `${monthlyCount ?? 0} 次`}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 mt-6 flex flex-col gap-3">
          <Link
            href="/audit/forms"
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
          >
            <span className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: "#EAF5F3", color: "#0E6E66"  }}>
              <ClipboardList size={22} />
            </span>
            <span className="flex-1">
              <div className="text-sm font-semibold">選擇稽核表</div>
              <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                開始登記手部衛生、尖銳物、PPE 或 BBE
              </div>
            </span>
          </Link>

          <Link
            href="/audit/report"
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
          >
            <span className="flex items-center justify-center rounded-xl shrink-0" style={{ width: 44, height: 44, background: "#EAF5F3", color: "#0E6E66" }}>
              <FileBarChart size={22} />
            </span>
            <span className="flex-1">
              <div className="text-sm font-semibold">查看稽核月報</div>
              <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                查看本診所各表單的月統計、下載 PDF
              </div>
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
