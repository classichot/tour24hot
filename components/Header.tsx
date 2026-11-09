"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LANGS } from "@/lib/i18n";
import { useApp } from "@/lib/store";
import { NAV } from "@/lib/nav";
import AccountMenu from "@/components/auth/AccountMenu";

const MARKET_LANGS = LANGS.filter((item) => item.id !== "ru");

function navBtnCls(active: boolean) {
  return `shrink-0 py-1 text-[13px] font-bold font-[family-name:var(--font-heading)] whitespace-nowrap no-underline border-b-2 ${
    active ? "text-accent-700 border-accent" : "text-text border-transparent hover:border-divider"
  }`;
}

function segBtnCls(active: boolean) {
  return `px-2 py-1 cursor-pointer text-[11px] font-bold font-[family-name:var(--font-heading)] border-0 whitespace-nowrap ${
    active ? "bg-accent text-text" : "bg-transparent text-text hover:bg-surface"
  }`;
}

function opLinkCls(active: boolean) {
  return `shrink-0 px-2 py-1 text-[12px] font-bold font-[family-name:var(--font-heading)] whitespace-nowrap no-underline ${
    active ? "bg-text text-bg" : "text-neutral-800 hover:bg-surface"
  }`;
}

/** Track whether the link strip is cut off on either side, so arrows and fades only show when needed. */
function useOverflow<T extends HTMLElement>(contentKey: string) {
  const ref = useRef<T>(null);
  const [cut, setCut] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const left = el.scrollLeft > 2;
      const right = el.scrollWidth - el.clientWidth - el.scrollLeft > 2;
      setCut((prev) => (prev.left === left && prev.right === right ? prev : { left, right }));
    };
    // Watch the links too: a late web-font swap widens them without resizing the strip itself.
    const ro = new ResizeObserver(check);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    el.addEventListener("scroll", check, { passive: true });
    const center = () => {
      const active = el.querySelector<HTMLElement>('[aria-current="page"]');
      if (active) el.scrollLeft = Math.max(0, active.offsetLeft - el.clientWidth / 2 + active.offsetWidth / 2);
    };
    center();
    let live = true;
    // Web fonts change link widths after first paint; re-center the current page once they are in.
    document.fonts?.ready.then(() => live && center());
    const raf = requestAnimationFrame(check);
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("scroll", check);
    };
  }, [contentKey]);
  return { ref, cut };
}

const TRAVELER_TOOLS = ["/advisor", "/match", "/agents", "/agent-direct", "/group", "/trips", "/burn", "/compare"];

export default function Header() {
  const { t, lang, setLang, inboundMode, setInboundMode } = useApp();
  const path = usePathname() || "";
  const search = useSearchParams();
  const router = useRouter();

  const starts = (p: string) => path.startsWith(p);

  // Same list the Control Center manages (lib/nav.ts), so both stay in sync.
  const items = NAV[inboundMode ? "inbound" : "outbound"].map((n) => ({
    href: n.href,
    label: t[n.label],
    active: n.active(path, inboundMode),
  }));

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
    if (path === "/admin" || TRAVELER_TOOLS.some((p) => path === p || path.startsWith(`${p}/`))) {
      const q = new URLSearchParams(search.toString());
      q.set("dir", nextInbound ? "inbound" : "outbound");
      router.replace(`${path}?${q.toString()}`);
    }
  };

  const { ref: stripRef, cut } = useOverflow<HTMLDivElement>(`${inboundMode}|${lang}|${path}`);
  const nudge = (dir: 1 | -1) => stripRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  const fade =
    cut.left && cut.right
      ? "[mask-image:linear-gradient(to_right,transparent,#000_32px,#000_calc(100%-32px),transparent)]"
      : cut.right
        ? "[mask-image:linear-gradient(to_right,#000_calc(100%-32px),transparent)]"
        : cut.left
          ? "[mask-image:linear-gradient(to_right,transparent,#000_32px)]"
          : "";
  const arrowCls =
    "shrink-0 h-7 w-7 inline-flex items-center justify-center border border-divider bg-bg cursor-pointer text-[15px] leading-none hover:bg-surface";

  /* Desktop: logo on the left; row 1 = direction + language (traveler controls) ··· operator tools;
     row 2 = the traveler menu links on their own full-width line.
     Tablet: row 1 = logo ··· operator tools; row 2 = direction · links · language.
     Phone: as tablet, but the links drop to a full-width row 3 so more than one fits. */
  return (
    <header className="sticky top-0 z-[60] bg-bg border-b-2 border-divider">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-[22px] py-2.5 grid grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[auto_auto_auto_minmax(0,1fr)] items-center gap-x-3 lg:gap-x-6 gap-y-1.5 sm:gap-y-2">
        <div className="col-[1/2] row-[1/2] lg:row-[1/3] flex min-w-0 flex-col gap-1">
          <Link
            href={inboundMode ? "/inbound" : "/"}
            className="font-[family-name:var(--font-heading)] font-extrabold text-[30px] sm:text-[40px] leading-none tracking-[-0.02em] text-text no-underline"
          >
            TOUR<span className="text-[#ffc61a]">24</span>
          </Link>
          <span className="hidden sm:block text-[11px] leading-tight max-w-[220px] text-neutral-700">{t.tagline}</span>
        </div>

        <div className="col-[2/4] row-[1/2] lg:col-[4/5] flex min-w-0 items-center justify-end gap-2">
          <nav
            className="flex min-w-0 items-center justify-end gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Operator"
          >
            <Link href="/os" className={`${opLinkCls(starts("/os"))} border border-divider mr-1`}>
              {t.navOs}
            </Link>
            <Link href="/host" className={opLinkCls(starts("/host"))}>
              {t.navHost}
            </Link>
            <Link href="/admin" className={opLinkCls(starts("/admin"))}>
              {t.navAdmin}
            </Link>
          </nav>
          {/* Outside the scrolling nav so its dropdown is not clipped. */}
          <AccountMenu />
        </div>

        <div className="col-[1/2] row-[2/3] lg:col-[2/3] lg:row-[1/2] inline-flex justify-self-start border border-divider" role="group" aria-label={t.fDirection}>
          <button type="button" onClick={() => switchMode(false)} className={segBtnCls(!inboundMode)} aria-pressed={!inboundMode}>
            {t.navModeOut}
          </button>
          <button type="button" onClick={() => switchMode(true)} className={segBtnCls(inboundMode)} aria-pressed={inboundMode}>
            {t.navModeIn}
          </button>
        </div>

        <div className="col-[3/4] row-[2/3] lg:col-[3/4] lg:row-[1/2] inline-flex justify-self-end lg:justify-self-start border border-divider" role="group" aria-label="Language">
          {MARKET_LANGS.map((item) => (
            <button key={item.id} type="button" onClick={() => setLang(item.id)} className={segBtnCls(lang === item.id)} aria-pressed={lang === item.id}>
              {item.short}
            </button>
          ))}
        </div>

        <nav className="col-[1/4] row-[3/4] sm:col-[2/3] sm:row-[2/3] lg:col-[2/5] relative flex min-w-0 items-center" aria-label="Marketplace">
          <div
            ref={stripRef}
            className={`relative flex min-w-0 flex-1 items-center gap-x-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${fade}`}
          >
            {items.map((item) => (
              <Link key={item.href} href={item.href} className={navBtnCls(item.active)} aria-current={item.active ? "page" : undefined}>
                {item.label}
              </Link>
            ))}
          </div>
          {/* Arrows float over the faded edges so they never shrink the strip they scroll. */}
          {cut.left && (
            <button type="button" className={`${arrowCls} absolute left-0`} onClick={() => nudge(-1)} aria-label="Scroll menu left">
              ‹
            </button>
          )}
          {cut.right && (
            <button type="button" className={`${arrowCls} absolute right-0`} onClick={() => nudge(1)} aria-label="Scroll menu right">
              ›
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
