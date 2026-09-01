"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, ChevronLeft } from "lucide-react";
import Link from "next/link";

const ROLES = [
  { key: "doctor", label: "醫師" },
  { key: "nurse", label: "護理人員" },
  { key: "cleaner", label: "清潔人員" },
];

const emptyForm = {
  doctorStaffCount: "",
  doctorCompliantCount: "",
  nurseStaffCount: "",
  nurseCompliantCount: "",
  cleanerStaffCount: "",
  cleanerCompliantCount: "",
};

export default function BbeAuditForm() {
  const [form, setForm] = useState(emptyForm);
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // every field must be filled in, and compliant count can never exceed staff count
  const allFilled = ROLES.every(
    (r) => form[`${r.key}StaffCount`] !== "" && form[`${r.key}CompliantCount`] !== ""
  );
  const allValid = ROLES.every((r) => {
    const staff = Number(form[`${r.key}StaffCount`]);
    const compliant = Number(form[`${r.key}CompliantCount`]);
    return compliant <= staff;
  });
  const canSubmit = allFilled && allValid;

  const setField = (key, value) => {
    // digits only
    if (value !== "" && !/^\d+$/.test(value)) return;
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const numeric = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, Number(v)]));
    setEntries((prev) => [
      { id: editingId ?? Date.now(), ...numeric },
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
    setForm(Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, String(v)])));
    setEditingId(id);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
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
        <div className="px-5 pt-5 pb-4">
          <Link href="/audit" className="flex items-center gap-1 text-sm mb-2" style={{ color: "#5B6B72" }}>
            <ChevronLeft size={16} /> 返回選擇表單
          </Link>
          <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
            手肘以下淨空稽核
          </h1>
          <p className="text-xs mt-1" style={{ color: "#5B6B72" }}>
            請輸入本次觀察的當班人數與符合人數（三種人員皆必填）
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
          {ROLES.map((r) => {
            const staffKey = `${r.key}StaffCount`;
            const compliantKey = `${r.key}CompliantCount`;
            const staff = Number(form[staffKey]);
            const compliant = Number(form[compliantKey]);
            const invalid = form[staffKey] !== "" && form[compliantKey] !== "" && compliant > staff;
            return (
              <div key={r.key} className="rounded-xl p-4" style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}>
                <div className="text-sm font-medium mb-3">{r.label}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "#5B6B72" }}>
                      當班人員數
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form[staffKey]}
                      onChange={(e) => setField(staffKey, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: "#DDE3E4" }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: "#5B6B72" }}>
                      符合人數
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={form[compliantKey]}
                      onChange={(e) => setField(compliantKey, e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      style={{ borderColor: invalid ? "#A63B33" : "#DDE3E4" }}
                      placeholder="0"
                    />
                  </div>
                </div>
                {invalid && (
                  <p className="text-xs mt-2" style={{ color: "#A63B33" }}>
                    符合人數不能超過當班人員數
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="px-5 mt-5">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm"
            style={{ background: "#0E6E66", color: "#FFFFFF", fontWeight: 700, opacity: canSubmit ? 1 : 0.5 }}
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
                  <div className="flex gap-3 text-xs">
                    {ROLES.map((r) => (
                      <span key={r.key} style={{ color: "#5B6B72" }}>
                        {r.label} {e[`${r.key}CompliantCount`]}/{e[`${r.key}StaffCount`]}
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
