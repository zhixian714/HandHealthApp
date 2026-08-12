"use client";

import { useState, useMemo } from "react";
import { Undo2, Building2, Clock3, CircleUser } from "lucide-react";

// ---- static reference data (from the paper form) ----
const STAFF_CODES = [
  { code: "DR", label: "醫師、腎臟科醫師" },
  { code: "N", label: "護士、助理護士" },
  { code: "BL", label: "透析照護技術員" },
  { code: "PC", label: "病患服務助理、助理、書記" },
  { code: "AC", label: "行政助理" },
  { code: "D", label: "清潔人員" },
  { code: "O", label: "其他、志工、工程師等" },
  { code: "AH", label: "其他醫療人員、營養師復健師等" },
];

const MOMENTS = [
  { no: 1, label: "接觸病人前", detail: "接觸病人前或接觸與病患連接的透析機前" },
  { no: 2, label: "侵入性照護前", detail: "執行侵入性病患照護/程序前" },
  { no: 3, label: "體液暴觸後", detail: "執行侵入性病患照護/程序或潛在體液或血液後" },
  { no: 4, label: "接觸病人後", detail: "接觸病患或與病患連接的透析機後" },
  { no: 5, label: "接觸環境後", detail: "僅只有接觸病患周圍物品/環境後" },
];

const ACTIVITIES = [
  { key: "RUB", label: "Rub 乾洗手", color: "#B8842B" },
  { key: "WASH", label: "Wash 濕洗手", color: "#2B5FA6" },
  { key: "MISS", label: "Miss 未執行", color: "#A63B33" },
];

const GLOVES = [
  { key: "ON", label: "On" },
  { key: "OFF", label: "Off" },
  { key: "CONT", label: "Cont" },
];

// ---- svg polar helpers for the radial moment gauge ----
const polar = (cx, cy, r, deg) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(2)),
    y: Number((cy + r * Math.sin(rad)).toFixed(2)),
  };
};

const wedgePath = (cx, cy, innerR, outerR, startDeg, endDeg) => {
  const p1 = polar(cx, cy, outerR, startDeg);
  const p2 = polar(cx, cy, outerR, endDeg);
  const p3 = polar(cx, cy, innerR, endDeg);
  const p4 = polar(cx, cy, innerR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
};

export default function AuditForm() {
  const [step, setStep] = useState("code"); // code -> moment -> activity -> glove
  const [code, setCode] = useState(null);
  const [moment, setMoment] = useState(null);
  const [activity, setActivity] = useState(null);
  const [entries, setEntries] = useState([]);

  const gap = 6; // degree gap between wedges
  const seg = 360 / 5;
  const innerR = 46;
  const outerR = 118;

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach((e) => (c[e.moment] += 1));
    return c;
  }, [entries]);

  const maxCount = Math.max(1, ...Object.values(counts));

  const resetFlow = () => {
    setCode(null);
    setMoment(null);
    setActivity(null);
    setStep("code");
  };

  const commit = (glove) => {
    setEntries((prev) => [
      { id: Date.now(), code, moment, activity, glove },
      ...prev,
    ]);
    resetFlow();
  };

  const undoLast = () => setEntries((prev) => prev.slice(1));

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

      <div className="w-full max-w-md pb-28" style={{ color: "#16242C" }}>
        {/* session bar */}
        <div className="px-5 pt-5 pb-4 sticky top-0 z-10" style={{ background: "#F5F7F8" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6B72" }}>
              <Building2 size={15} />
              <span>台北腎臟診所</span>
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: "#5B6B72" }}>
              <Clock3 size={15} />
              <span className="mono">14:22</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              手部衛生稽核
            </h1>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#5B6B72" }}>
              <CircleUser size={15} />
              <span>稽核者 A</span>
            </div>
          </div>
        </div>

        {/* radial 5-moments gauge, doubles as live stat readout */}
        <div className="flex flex-col items-center px-5 mt-1">
          <svg viewBox="0 0 260 260" width="260" height="260">
            <circle cx="130" cy="130" r="40" fill="#FFFFFF" stroke="#DDE3E4" />
            <text x="130" y="126" textAnchor="middle" className="num" fontSize="13" fill="#5B6B72">
              本次已登記
            </text>
            <text x="130" y="146" textAnchor="middle" className="num" fontSize="26" fontWeight="700" fill="#0A4F49">
              {entries.length}
            </text>

            {MOMENTS.map((m) => {
              const start = (m.no - 1) * seg + gap / 2;
              const end = m.no * seg - gap / 2;
              const filled = innerR + ((outerR - innerR) * counts[m.no]) / maxCount;
              const isSelected = moment === m.no;
              const mid = (start + end) / 2;
              const lp = polar(130, 130, outerR + 20, mid);
              return (
                <g key={m.no}>
                  <path d={wedgePath(130, 130, innerR, outerR, start, end)} fill="#E9EDEE" />
                  {counts[m.no] > 0 && (
                    <path d={wedgePath(130, 130, innerR, filled, start, end)} fill="#0E6E66" opacity={0.85} />
                  )}
                  <path
                    d={wedgePath(130, 130, innerR, outerR, start, end)}
                    fill="transparent"
                    stroke={isSelected ? "#0E6E66" : "transparent"}
                    strokeWidth={isSelected ? 3 : 0}
                    style={{ cursor: code ? "pointer" : "not-allowed" }}
                    onClick={() => code && (setMoment(m.no), setStep("activity"))}
                  />
                  <text
                    x={lp.x}
                    y={lp.y}
                    textAnchor="middle"
                    className="num"
                    fontSize="15"
                    fontWeight="700"
                    fill="#16242C"
                    style={{ pointerEvents: "none" }}
                  >
                    {m.no}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-sm text-center mt-1 px-4" style={{ color: "#5B6B72", minHeight: 20 }}>
            {moment ? MOMENTS[moment - 1].detail : "先選代碼，再點選時機"}
          </p>
        </div>

        {/* step 1: staff code */}
        <div className="px-5 mt-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            代碼
          </div>
          <div className="flex flex-wrap gap-2">
            {STAFF_CODES.map((s) => (
              <button
                key={s.code}
                onClick={() => (setCode(s.code), setStep("moment"))}
                className="mono px-3 py-2 rounded-lg text-sm border"
                style={{
                  borderColor: code === s.code ? "#0E6E66" : "#DDE3E4",
                  background: code === s.code ? "#0E6E66" : "#FFFFFF",
                  color: code === s.code ? "#FFFFFF" : "#16242C",
                  fontWeight: 600,
                }}
              >
                {s.code}
              </button>
            ))}
          </div>
        </div>

        {/* step 3/4: activity + glove, only after moment picked */}
        {code && moment && (
          <div className="px-5 mt-6">
            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
              活動
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ACTIVITIES.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setActivity(a.key)}
                  className="rounded-lg py-3 text-sm"
                  style={{
                    border: `2px solid ${activity === a.key ? a.color : "#DDE3E4"}`,
                    background: activity === a.key ? a.color : "#FFFFFF",
                    color: activity === a.key ? "#FFFFFF" : "#16242C",
                    fontWeight: 600,
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>

            {activity && (
              <div className="mt-4">
                <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
                  手套
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {GLOVES.map((g) => (
                    <button
                      key={g.key}
                      onClick={() => commit(g.key)}
                      className="rounded-lg py-3 text-sm border"
                      style={{ borderColor: "#DDE3E4", background: "#FFFFFF", color: "#16242C", fontWeight: 600 }}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* recent entries log */}
        {entries.length > 0 && (
          <div className="px-5 mt-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs tracking-wide" style={{ color: "#5B6B72" }}>
                最近登記
              </span>
              <button onClick={undoLast} className="flex items-center gap-1 text-xs" style={{ color: "#A63B33" }}>
                <Undo2 size={13} /> 復原上一筆
              </button>
            </div>
            <div className="flex flex-col gap-1.5">
              {entries.slice(0, 5).map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
                >
                  <span className="mono font-semibold">{e.code}</span>
                  <span style={{ color: "#5B6B72" }}>時機 {e.moment}</span>
                  <span style={{ color: ACTIVITIES.find((a) => a.key === e.activity)?.color, fontWeight: 600 }}>
                    {e.activity}
                  </span>
                  <span style={{ color: "#5B6B72" }}>{e.glove}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* floating total counter, bottom right per the original spec */}
      <div
        className="fixed bottom-6 right-6 rounded-full flex flex-col items-center justify-center shadow-lg"
        style={{ width: 64, height: 64, background: "#16242C", color: "#FFFFFF" }}
      >
        <span className="num text-lg font-bold leading-none">{entries.length}</span>
        <span className="text-[9px] mt-0.5" style={{ color: "#9FB0B5" }}>
          moments
        </span>
      </div>
    </div>
  );
}
