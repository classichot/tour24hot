"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/lib/store";
import { pkgById } from "@/lib/data";
import { X } from "./icons";

export default function CompareTray() {
  const { t, L, compare, toggleCompare, clearCompare } = useApp();
  const path = usePathname();
  if (compare.length === 0 || path === "/compare" || path.startsWith("/admin") || path.startsWith("/agency")) return null;

  return (
    <div className="fixed left-0 right-0 bottom-0 z-[70] bg-text text-bg">
      <div className="max-w-[1400px] mx-auto px-[22px] py-3 flex items-center gap-4 flex-wrap">
        <div className="text-[11px] tracking-[0.12em] uppercase font-extrabold">
          {t.trayLabel} ({compare.length}/4)
        </div>
        <div className="flex gap-2 flex-wrap flex-1">
          {compare.map((id) => {
            const p = pkgById(id);
            if (!p) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-2 border border-neutral-600 px-2 py-[5px] text-xs max-w-[280px]"
              >
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">{L(p.title)}</span>
                <button
                  type="button"
                  onClick={() => toggleCompare(id)}
                  className="bg-none border-0 text-bg cursor-pointer p-0 flex"
                  aria-label={t.remove}
                >
                  <X />
                </button>
              </div>
            );
          })}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[11px] text-neutral-400">{t.trayHint}</span>
          <Link href="/compare" className="btn btn-primary no-underline">
            {t.trayCompare}
          </Link>
          <button
            type="button"
            onClick={clearCompare}
            className="btn border border-neutral-600 text-bg"
          >
            {t.trayClear}
          </button>
        </div>
      </div>
    </div>
  );
}
