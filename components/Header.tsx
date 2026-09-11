"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";

const MARKET_LANGS = LANGS.filter((item) => item.id !== "ru");

function navBtnCls(active: boolean) {
  return `bg-none border-0 px-0 py-0.5 cursor-pointer text-[12px] font-bold font-[family-name:var(--font-heading)] whitespace-nowrap ${
    active ? "text-accent-700 border-b-2 border-accent" : "text-text border-b-2 border-transparent"
  }`;
}

function segBtnCls(active: boolean) {
  return `px-1.5 py-0.5 cursor-pointer text-[11px] font-bold font-[family-name:var(--font-heading)] border-0 whitespace-nowrap ${
    active ? "bg-accent text-text" : "bg-transparent text-text"
  }`;
}

const TRAVELER_TOOLS = ["/advisor", "/match", "/agents", "/agent-direct", "/group", "/trips", "/burn", "/compare"];

export default function Header() {
  const { t, lang, setLang, inboundMode, setInboundMode } = useApp();
  const path = usePathname() || "";
  const search = useSearchParams();
  const router = useRouter();

  const at = (p: string) => path === p;
  const starts = (p: string) => path.startsWith(p);

  const outboundItems = [
    { href: "/search?dir=outbound", label: t.navSearch, active: path === "/search" && !inboundMode },
    { href: "/advisor?dir=outbound", label: t.navAdvisor, active: starts("/advisor") || starts("/match") },
    { href: "/agents?dir=outbound", label: t.navAgents, active: starts("/agents") || starts("/agent-direct") },
    { href: "/group?dir=outbound", label: t.navGroup, active: at("/group") },
    { href: "/trips?dir=outbound", label: t.navTrips, active: at("/trips") },
    { href: "/burn?dir=outbound", label: t.navBurn, active: at("/burn") },
    { href: "/agency", label: t.navOutAgency, active: at("/agency") || (starts("/agency") && !starts("/inbound")) },
  ];

  const inboundItems = [
    { href: "/inbound", label: t.navInbound, active: at("/inbound") || (path === "/search" && inboundMode) },
    { href: "/advisor?dir=inbound", label: t.navInAdvisor, active: starts("/advisor") || starts("/match") },
    { href: "/agents?dir=inbound", label: t.navInAgents, active: starts("/agents") || starts("/agent-direct") },
    { href: "/group?dir=inbound", label: t.navInGroup, active: at("/group") },
    { href: "/trips?dir=inbound", label: t.navInTrips, active: at("/trips") },
    { href: "/inbound/agency", label: t.navInAgency, active: starts("/inbound/agency") },
  ];

  const items = inboundMode ? inboundItems : outboundItems;

  const switchMode = (nextInbound: boolean) => {
    if (nextInbound === inboundMode) return;
    setInboundMode(nextInbound);
    if (path === "/agency" || starts("/inbound/agency")) {
      router.push(nextInbound ? "/inbound/agency" : "/agency");
      return;
    }
    if (path === "/search") {
      const q = new URLSearchParams(search.toString());
      q.set("dir", nextInbound ? "inbound" : "outbound");
      router.push(`/search?${q.toString()}`);
      return;
    }
    if (path === "/" || starts("/inbound") || /^\/(packages|book)\//.test(path)) {
      router.push(nextInbound ? "/inbound" : "/");
      return;
    }
    if (TRAVELER_TOOLS.some((p) => path === p || path.startsWith(`${p}/`))) {
      const q = new URLSearchParams(search.toString());
      q.set("dir", nextInbound ? "inbound" : "outbound");
      router.replace(`${path}?${q.toString()}`);
    }
  };

  return (
    <header className="sticky top-0 z-[60] bg-bg border-b-2 border-divider">
      <div className="max-w-[1400px] mx-auto px-[22px] py-2.5 flex items-start gap-3">
        <div className="flex shrink-0 flex-col gap-1">
          <Link
            href={inboundMode ? "/inbound" : "/"}
            className="bg-none border-0 p-0 cursor-pointer font-[family-name:var(--font-heading)] font-extrabold text-[44px] leading-none tracking-[-0.02em] text-text no-underline"
          >
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <span className="text-[11px] leading-tight max-w-[220px] text-neutral-700">{t.tagline}</span>
          <nav className="flex items-center gap-2 flex-wrap mt-0.5">
            <Link href="/os" className="btn btn-secondary no-underline">
              {t.navOs}
            </Link>
            <Link href="/admin" className="btn btn-ghost no-underline text-[12px]">
              {t.navAdmin}
            </Link>
          </nav>
        </div>
        <nav className="flex gap-2 flex-nowrap items-center min-w-0 flex-1 pt-2">
          <div className="inline-flex shrink-0 border border-divider" role="group" aria-label={t.fDirection}>
            <button type="button" onClick={() => switchMode(false)} className={segBtnCls(!inboundMode)}>
              {t.navModeOut}
            </button>
            <button type="button" onClick={() => switchMode(true)} className={segBtnCls(inboundMode)}>
              {t.navModeIn}
            </button>
          </div>
          {items.map((item) => (
            <Link key={item.href} href={item.href} className={`${navBtnCls(item.active)} no-underline`}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="inline-flex shrink-0 border border-divider">
          {MARKET_LANGS.map((item) => (
            <button key={item.id} type="button" onClick={() => setLang(item.id)} className={segBtnCls(lang === item.id)}>
              {item.short}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
