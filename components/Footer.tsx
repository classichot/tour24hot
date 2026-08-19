"use client";

import { useApp } from "@/lib/store";

export default function Footer() {
  const { t } = useApp();
  return (
    <footer className="border-t-2 border-text mt-5">
      <div className="max-w-[1400px] mx-auto px-[22px] pt-[26px] pb-24 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[22px]">
        <div>
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[40px] leading-none">
            TOUR<span className="text-[#ffc61a]">24</span>
          </div>
          <div className="text-xs text-neutral-700 max-w-[230px] mt-1">{t.tagline}</div>
        </div>
        <div className="text-xs text-neutral-800 flex flex-col gap-[5px]">
          <a href="/search" className="font-extrabold no-underline text-text">{t.navSearch}</a>
          <a href="/compare" className="no-underline text-neutral-800">{t.compareTitle}</a>
          <a href="/advisor" className="no-underline text-neutral-800">{t.advTitle}</a>
          <a href="/agents" className="no-underline text-neutral-800">{t.navAgents}</a>
          <a href="/group" className="no-underline text-neutral-800">{t.navGroup}</a>
        </div>
        <div className="text-xs text-neutral-800 flex flex-col gap-[5px]">
          <span className="font-extrabold">{t.guarantee}</span>
          <span>{t.vf1}</span>
          <span>{t.vf5}</span>
          <a href="/trips" className="no-underline text-neutral-800">{t.tSupport}</a>
        </div>
        <div className="text-xs text-neutral-800 flex flex-col gap-[5px]">
          <a href="/agency" className="font-extrabold no-underline text-text">{t.navAgency}</a>
          <a href="/agent-direct" className="no-underline text-neutral-800">{t.agntHomeDev}</a>
          <span>{t.upTitle}</span>
          <span>{t.agBookings}</span>
          <a href="/admin" className="no-underline text-neutral-800">{t.navAdmin}</a>
        </div>
      </div>
    </footer>
  );
}
