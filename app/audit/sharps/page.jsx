"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";

const QUESTIONS = [
  { key: "carriedToPointOfCare", label: "尖銳物攜至照護點使用" },
  { key: "noRecapping", label: "不回套" },
  { key: "needleNotOnSurface", label: "針頭不置於工作區表面" },
];

export default function SharpsAuditForm() {
  const [answers, setAnswers] = useState({});
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const allAnswered = QUESTIONS.every((q) => typeof answers[q.key] === "boolean");
  const setAnswer = (key, value) => setAnswers((prev) => ({ ...prev, [key]: value }));

  const resetForm = () => {
    setAnswers({});
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!allAnswered) return;
    setEntries((prev) => [
      { id: editingId ?? Date.now(), ...answers },
      ...prev.filter((e) => e.id !== editingId),
    ]);
    resetForm();
  };

  const deleteEntry = (id) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    if (editingId === id) resetForm();
  };

  const editEntry = (entry) => {
    const { id, ...rest } = entry;
    setAnswers(rest);
    setEditingId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#F5F7F8" }}
      className="min-h-screen w-full flex justify-center"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap');
        .num { font-family:'Barlow Condensed',sans-serif; }
      `}</style>

      <div className="w-full max-w-md pb-28" style={{ color: "#16242C" }}>
        <div className="px-5 pt-5 pb-4">
          <Link href="/audit" className="flex items-center gap-1 text-sm mb-2" style={{ color: "#5B6B72" }}>
            <ChevronLeft size={16} /> 返回選擇表單
          </Link>
          <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
            尖銳物安全使用及處置
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5B6B72" }}>
            每次觀察，以下 3 題皆為必填
          </p>

          {editingId && (
            <div
              className="mt-3 flex items-center justify-between rounded-lg px-3 py-2 text-sm"
              style={{ background: "#FFF4E5", border: "1px solid #E8C48A", color: "#8A5A17" }}
            >
              <span>正在編輯這一筆紀錄</span>
              <button onClick={resetForm} className="text-xs underline">
                取消編輯
              </button>
            </div>
          )}
        </div>

        <div className="px-5 flex flex-col gap-3">
          {QUESTIONS.map((q) => (
            <div key={q.key} className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
              <div className="text-sm font-medium mb-3">{q.label}</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: true, label: "YES" },
                  { value: false, label: "NO" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setAnswer(q.key, opt.value)}
                    className="rounded-lg py-2.5 text-sm border"
                    style={{
                      borderColor: answers[q.key] === opt.value ? "#0E6E66" : "#DDE3E4",
                      background: answers[q.key] === opt.value ? "#0E6E66" : "#FFFFFF",
                      color: answers[q.key] === opt.value ? "#FFFFFF" : "#16242C",
                      fontWeight: 600,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 mt-5">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
            style={{ background: "#0E6E66", color: "#FFFFFF", fontWeight: 700, opacity: allAnswered ? 1 : 0.5 }}
          >
            <Check size={16} />
            {editingId ? "儲存修改" : "送出這筆紀錄"}
          </button>
        </div>

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
                  <div className="flex gap-3">
                    {QUESTIONS.map((q) => (
                      <span key={q.key} style={{ color: e[q.key] ? "#0E6E66" : "#A63B33", fontWeight: 600 }}>
                        {e[q.key] ? "Y" : "N"}
                      </span>
                    ))}
                  </div>
                  <span className="flex items-center gap-1">
                    <button onClick={() => editEntry(e)} aria-label="編輯" className="p-1.5 rounded-md" style={{ color: "#5B6B72" }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteEntry(e.id)} aria-label="刪除" className="p-1.5 rounded-md" style={{ color: "#A63B33" }}>
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div
        className="fixed bottom-6 right-6 rounded-full flex flex-col items-center justify-center shadow-lg"
        style={{ width: 64, height: 64, background: "#16242C", color: "#FFFFFF" }}
      >
        <span className="num text-lg font-bold leading-none">{entries.length}</span>
        <span className="text-[9px] mt-0.5" style={{ color: "#9FB0B5" }}>
          筆數
        </span>
      </div>
    </div>
  );
}
