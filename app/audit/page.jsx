"use client";

import { useState, useMemo, useEffect } from "react";
import { Pencil, Trash2, Building2, Clock3, CircleUser, Info } from "lucide-react";

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
  { no: 1, short: "接觸病人前", label: "接觸病人前", detail: "接觸病人前或接觸與病患連接的透析機前" },
  { no: 2, short: "侵入前", label: "侵入性照護前", detail: "執行侵入性病患照護/程序前" },
  { no: 3, short: "體液後", label: "體液暴觸後", detail: "執行侵入性病患照護/程序或潛在體液或血液後" },
  { no: 4, short: "接觸病人後", label: "接觸病人後", detail: "接觸病患或與病患連接的透析機後" },
  { no: 5, short: "接觸環境後", label: "接觸環境後", detail: "僅只有接觸病患周圍物品/環境後" },
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

export default function AuditForm() {
  const [code, setCode] = useState(null);
  const [moment, setMoment] = useState(null);
  const [activity, setActivity] = useState(null);
  const [entries, setEntries] = useState([]);
  // when editing an existing entry, remember its id so we can replace it once resubmitted
  const [editingId, setEditingId] = useState(null);

  // live clock — updates every second, starts null so server/client markup matches on first render
  const [now, setNow] = useState(null);
  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const timeLabel = now
    ? now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit", hour12: false })
    : "--:--";

  const counts = useMemo(() => {
    const c = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    entries.forEach((e) => (c[e.moment] += 1));
    return c;
  }, [entries]);

  const resetFlow = () => {
    setCode(null);
    setMoment(null);
    setActivity(null);
    setEditingId(null);
  };

  const commit = (glove) => {
    setEntries((prev) => [
      { id: editingId ?? Date.now(), code, moment, activity, glove },
      ...prev.filter((e) => e.id !== editingId),
    ]);
    resetFlow();
  };

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetFlow();
  };

  const editEntry = (entry) => {
    setCode(entry.code);
    setMoment(entry.moment);
    setActivity(entry.activity);
    setEditingId(entry.id);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
              <span className="mono">{timeLabel}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 ">
            <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
              手部衛生稽核
            </h1>
            <div className="flex items-center gap-1.5 text-sm" style={{ color: "#5B6B72" }}>
              <CircleUser size={15} />
              <span>稽核者 A</span>
            </div>
          </div>

          {editingId && (
            <div
              className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              style={{ background: "#FFF4E5", border: "1px solid #E8C48A", color: "#8A5A17" }}
            >
              <span>正在編輯這一筆紀錄</span>
              <button onClick={resetFlow} className="text-xs underline">
                取消編輯
              </button>
            </div>
          )}
        </div>

        {/* prominent standalone instruction banner — only shown before a code is picked */}
        {!code && (
          <div className="px-5 mt-2 mb-4">
            <div
              className="flex items-start gap-2.5 rounded-xl px-4 py-3"
              style={{ background: "#0E6E66", color: "#FFFFFF" }}
            >
              <Info size={18} className="mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-semibold">先選代碼，再點選時機</div>
                <div className="text-xs mt-0.5" style={{ color: "#CDEAE6" }}>
                  先點選被稽核者的職稱代碼，接著在下方選擇對應的稽核時機
                </div>
              </div>
            </div>
          </div>
        )}

        {/* step 1: staff code — moved to the top */}
        <div className="px-5">
          <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
            代碼
          </div>
          <div className="flex flex-wrap gap-2">
            {STAFF_CODES.map((s) => (
              <button
                key={s.code}
                onClick={() => setCode(s.code)}
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

        {/* step 2: moment — option A, vertical list cards instead of the pie gauge */}
        {code && (
          <div className="px-5 mt-6">
            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
              時機
            </div>
            <div className="flex flex-col gap-2">
              {MOMENTS.map((m) => {
                const selected = moment === m.no;
                return (
                  <button
                    key={m.no}
                    onClick={() => setMoment(m.no)}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left"
                    style={{
                      border: `2px solid ${selected ? "#0E6E66" : "#DDE3E4"}`,
                      background: selected ? "#EAF5F3" : "#FFFFFF",
                    }}
                  >
                    <span
                      className="num flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 32,
                        height: 32,
                        background: selected ? "#0E6E66" : "#E9EDEE",
                        color: selected ? "#FFFFFF" : "#16242C",
                        fontWeight: 700,
                        fontSize: 15,
                      }}
                    >
                      {m.no}
                    </span>
                    <span className="flex-1 text-sm font-semibold">{m.short}</span>
                    <span
                      className="mono text-xs px-2 py-1 rounded-full"
                      style={{ background: "#F1F4F4", color: "#5B6B72" }}
                    >
                      {counts[m.no]} 次
                    </span>
                  </button>
                );
              })}
            </div>

            {/* moment detail — kept in its original position, below the moment picker */}
            {moment && (
              <div
                className="w-full mt-3 rounded-lg px-3 py-2 text-sm text-center"
                style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
              >
                <span className="font-semibold">時機 {moment}：{MOMENTS[moment - 1].label}</span>
                <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                  {MOMENTS[moment - 1].detail}
                </div>
              </div>
            )}
          </div>
        )}

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

        {/* recent entries log — every row gets its own edit / delete controls */}
        {entries.length > 0 && (
          <div className="px-5 mt-8">
            <div className="text-xs mb-2 tracking-wide" style={{ color: "#5B6B72" }}>
              最近登記（共 {entries.length} 筆）
            </div>
            <div className="flex flex-col gap-1.5">
              {entries.map((e) => (
                <div
                  key={e.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm"
                  style={{
                    background: "#FFFFFF",
                    border: editingId === e.id ? "1px solid #0E6E66" : "1px solid #DDE3E4",
                  }}
                >
                  <span className="mono font-semibold w-10">{e.code}</span>
                  <span style={{ color: "#5B6B72" }} className="w-16">
                    時機 {e.moment}
                  </span>
                  <span
                    className="w-14"
                    style={{ color: ACTIVITIES.find((a) => a.key === e.activity)?.color, fontWeight: 600 }}
                  >
                    {e.activity}
                  </span>
                  <span style={{ color: "#5B6B72" }} className="w-10">
                    {e.glove}
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      onClick={() => editEntry(e)}
                      aria-label="編輯這筆紀錄"
                      className="p-1.5 rounded-md"
                      style={{ color: "#5B6B72" }}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      aria-label="刪除這筆紀錄"
                      className="p-1.5 rounded-md"
                      style={{ color: "#A63B33" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
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
