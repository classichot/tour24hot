"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { useHost } from "@/lib/host/store";
import { HOST_MAX_DAYS } from "@/lib/host/types";
import { LocText } from "@/components/os/ui";

const LINKS = [
  ["home", "/host"],
  ["days", "/host/days"],
  ["guests", "/host/guests"],
  ["arrivals", "/host/arrivals"],
] as const;

const OS_LANGS = LANGS.filter((item) => item.id !== "ru");

export default function HostShell({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "";
  const { lang, setLang } = useApp();
  const { h, snap, reset } = useHost();
  const stay = snap.stay;

  return (
    <div className="os-desk min-h-screen grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="os-side lg:min-h-screen lg:sticky lg:top-0 flex flex-col overflow-hidden">
        <div className="px-4 py-5 border-b border-white/15">
          <Link href="/host" className="no-underline font-[family-name:var(--font-heading)] font-extrabold text-[26px] leading-none tracking-[-0.02em] text-[#f3f2f2]">
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <div className="mt-3 text-[12px] font-extrabold leading-snug text-[#f3f2f2]">
            <LocText v={stay.host} />
          </div>
          <div className="mt-1.5 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#ffc61a]">{h.system}</div>
        </div>
        <nav className="flex lg:flex-col gap-0 overflow-auto flex-1 py-2">
          {LINKS.map(([key, href]) => {
            const active = href === "/host" ? path === "/host" : path.startsWith(href);
            return (
              <Link
                key={key}
                href={href}
                className={`os-nav-item px-4 py-2.5 no-underline text-[13px] font-bold whitespace-nowrap ${active ? "is-active" : ""}`}
              >
                {h[key]}
              </Link>
            );
          })}
        </nav>
        <div className="px-4 py-4 mt-auto border-t border-white/15 flex flex-col gap-2">
          <div className="text-[11px] text-white/70">
            {stay.days} / {HOST_MAX_DAYS} {h.days}
          </div>
          <button type="button" className="os-topbtn w-full justify-center text-[#f3f2f2] border border-white/20" onClick={reset}>
            {h.reset}
          </button>
          <Link href="/os" className="text-[11px] text-white/70">
            {h.os}
          </Link>
          <Link href="/" className="text-[11px] text-white/70">
            {h.site}
          </Link>
        </div>
      </aside>

      <div className="min-w-0 flex flex-col bg-white">
        <header className="os-topbar pl-10 lg:pl-14 pr-8 lg:pr-12 py-2 flex flex-wrap items-center justify-end gap-1">
          {OS_LANGS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={`os-topbtn ${lang === item.id ? "is-on" : ""}`}
            >
              {item.short}
            </button>
          ))}
        </header>
        <div className="pl-10 lg:pl-14 pr-8 lg:pr-12 py-8 pb-24 w-full">{children}</div>
      </div>
    </div>
  );
}
