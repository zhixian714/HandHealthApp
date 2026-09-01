"use client";

import Link from "next/link";
import { Droplets, Syringe, ShieldCheck, Ruler } from "lucide-react";

const FORMS = [
  {
    href: "/audit/hand-hygiene",
    icon: Droplets,
    title: "手部衛生稽核",
    desc: "5 個時機、活動與手套狀態記錄",
  },
  {
    href: "/audit/sharps",
    icon: Syringe,
    title: "尖銳物安全使用及處置",
    desc: "3 題，每次觀察皆必填",
  },
  {
    href: "/audit/ppe",
    icon: ShieldCheck,
    title: "個人防護裝備 (PPE)",
    desc: "5 題，每次觀察皆必填",
  },
  {
    href: "/audit/bbe",
    icon: Ruler,
    title: "手肘以下淨空稽核",
    desc: "醫師／護理人員／清潔人員，當班與符合人數",
  },
];

export default function AuditFormPicker() {
  return (
    <div
      style={{ fontFamily: "'IBM Plex Sans', sans-serif", background: "#F5F7F8" }}
      className="min-h-screen w-full flex justify-center"
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Barlow+Condensed:wght@600;700&display=swap');
        .num { font-family:'Barlow Condensed',sans-serif; }
      `}</style>

      <div className="w-full max-w-md pb-16" style={{ color: "#16242C" }}>
        <div className="px-5 pt-8 pb-6">
          <h1 className="num text-2xl tracking-tight" style={{ fontWeight: 700 }}>
            選擇要登記的稽核表
          </h1>
          <p className="text-sm mt-1" style={{ color: "#5B6B72" }}>
            點選下方其中一種表單開始記錄
          </p>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {FORMS.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.href}
                href={f.href}
                className="flex items-center gap-4 rounded-2xl p-4"
                style={{ background: "#FFFFFF", border: "1px solid #DDE3E4" }}
              >
                <span
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 44, height: 44, background: "#EAF5F3", color: "#0E6E66" }}
                >
                  <Icon size={22} />
                </span>
                <span className="flex-1">
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#5B6B72" }}>
                    {f.desc}
                  </div>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
