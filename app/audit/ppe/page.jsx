"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";

const BEFORE_QUESTIONS = [
  { key: "maskWorn", label: "配戴口罩（若未使用口罩需有護目鏡加口罩）" },
  { key: "gownWorn", label: "穿圍裙或隔離衣" },
  { key: "glovesWorn", label: "戴手套" },
];

const AFTER_QUESTIONS = [
  { key: "gownRemovedBeforeNextPatient", label: "接觸下一位病患前，立即移除並丟棄圍裙或隔離衣" },
  { key: "glovesRemovedAfterProcedure", label: "執行程序後或暴露血液/體液後，立即移除手套" },
];

const ALL_QUESTIONS = [...BEFORE_QUESTIONS, ...AFTER_QUESTIONS];

function QuestionCard({ q, value, onChange }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
      <div className="text-sm font-medium mb-3">{q.label}</div>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: true, label: "YES" },
          { value: false, label: "NO" },
        ].map((opt) => (
          <button
            key={String(opt.value)}
            onClick={() => onChange(opt.value)}
            className="rounded-lg py-2.5 text-sm border"
            style={{
              borderColor: value === opt.value ? "#0E6E66" : "#DDE3E4",
              background: value === opt.value ? "#0E6E66" : "#FFFFFF",
              color: value === opt.value ? "#FFFFFF" : "#16242C",
              fontWeight: 600,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PpeAuditForm() {
  const [answers, setAnswers] = useState({});
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const allAnswered = ALL_QUESTIONS.every((q) => typeof answers[q.key] === "boolean");
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
          <h1 className="num text-3xl tracking-tight" style={{ fontWeight: 700 }}>
            個人防護裝備 (PPE)
          </h1>
          <p className="text-m mt-1" style={{ color: "#5B6B72" }}>
            每次觀察，以下 5 題皆為必填
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

        <div className="px-5">
          <div className="text-m mb-2 tracking-wide flex items-center" style={{ color: "#5B6B72" }}>
            潛在接觸血液或液態化學物質之
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 font-bold rounded-full mx-1">
              前
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {BEFORE_QUESTIONS.map((q) => (
              <QuestionCard key={q.key} q={q} value={answers[q.key]} onChange={(v) => setAnswer(q.key, v)} />
            ))}
          </div>
        </div>

        <div className="px-5">
          <div className="text-m mb-2 mt-4 tracking-wide flex items-center" style={{ color: "#5B6B72" }}>
            暴露接觸血液或液態化學物質之
            <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-600 font-bold rounded-full mx-1">
              後
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {BEFORE_QUESTIONS.map((q) => (
              <QuestionCard key={q.key} q={q} value={answers[q.key]} onChange={(v) => setAnswer(q.key, v)} />
            ))}
          </div>
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
                  <div className="flex gap-2">
                    {ALL_QUESTIONS.map((q) => (
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
