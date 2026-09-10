"use client";

import Link from "next/link";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { OsProvider } from "@/lib/os/store";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { lang, setLang } = useApp();
  return (
    <OsProvider>
      <div className="min-h-screen bg-bg">
        <header className="border-b-2 border-divider px-4 py-3 flex items-center justify-between gap-2">
          <Link href="/os" className="no-underline text-text font-[family-name:var(--font-heading)] font-extrabold text-[24px]">
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <div className="inline-flex border border-divider">
            {LANGS.map((item) => (
              <button key={item.id} type="button" onClick={() => setLang(item.id)} className={`px-2 py-1 text-xs font-extrabold border-0 ${lang === item.id ? "bg-accent" : ""}`}>
                {item.short}
              </button>
            ))}
          </div>
        </header>
        <div className="max-w-[720px] mx-auto px-4 py-6">{children}</div>
      </div>
    </OsProvider>
  );
}
