"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";

function navBtnCls(active: boolean) {
  return `bg-none border-0 px-0 py-1 cursor-pointer text-sm font-extrabold font-[family-name:var(--font-heading)] ${
    active ? "text-accent-700 border-b-2 border-accent" : "text-text border-b-2 border-transparent"
  }`;
}

function segBtnCls(active: boolean) {
  return `px-3 py-1.5 cursor-pointer text-xs font-extrabold font-[family-name:var(--font-heading)] border-0 ${
    active ? "bg-accent text-text" : "bg-transparent text-text"
  }`;
}

export default function Header() {
  const { t, lang, setLang } = useApp();
  const path = usePathname();

  const at = (p: string) => path === p;

  return (
    <header className="sticky top-0 z-[60] bg-bg border-b-2 border-divider">
      <div className="max-w-[1400px] mx-auto px-[22px] py-3 flex items-center gap-[18px] flex-wrap">
        <Link
          href="/"
          className="bg-none border-0 p-0 cursor-pointer font-[family-name:var(--font-heading)] font-extrabold text-[44px] leading-none tracking-[-0.02em] text-text no-underline"
        >
          TOUR<span className="text-[#ffc61a]">24</span>
        </Link>
        <span className="text-[11px] leading-tight max-w-[200px] text-neutral-700">{t.tagline}</span>
        <nav className="flex gap-3.5 ml-auto flex-wrap items-center">
          <Link href="/search" className={`${navBtnCls(at("/search"))} no-underline`}>
            {t.navSearch}
          </Link>
          <Link href="/advisor" className={`${navBtnCls(path.startsWith("/advisor") || path.startsWith("/match"))} no-underline`}>
            {t.navAdvisor}
          </Link>
          <Link href="/agents" className={`${navBtnCls(path.startsWith("/agents") || path.startsWith("/agent-direct"))} no-underline`}>
            {t.navAgents}
          </Link>
          <Link href="/group" className={`${navBtnCls(at("/group"))} no-underline`}>
            {t.navGroup}
          </Link>
          <Link href="/trips" className={`${navBtnCls(at("/trips"))} no-underline`}>
            {t.navTrips}
          </Link>
          <Link href="/burn" className={`${navBtnCls(at("/burn"))} no-underline`}>
            {t.navBurn}
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-divider">
            <button type="button" onClick={() => setLang("th")} className={segBtnCls(lang === "th")}>
              ไทย
            </button>
            <button type="button" onClick={() => setLang("en")} className={segBtnCls(lang === "en")}>
              EN
            </button>
          </div>
          <Link href="/agency" className="btn btn-secondary no-underline">
            {t.navAgency}
          </Link>
          <Link href="/admin" className="btn btn-ghost no-underline text-[12px]">
            {t.navAdmin}
          </Link>
        </div>
      </div>
    </header>
  );
}
