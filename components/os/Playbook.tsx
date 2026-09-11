"use client";

import { useEffect } from "react";
import { useOs } from "@/lib/os/store";
import { PLAYBOOK_CODE, menuPlaybook, type MenuKey } from "@/lib/os/playbook";
import { useApp } from "@/lib/store";

export default function PlaybookPanel({
  menuKey,
  open,
  onClose,
}: {
  menuKey: MenuKey;
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useApp();
  const { o } = useOs();
  const book = menuPlaybook(lang, menuKey);
  const title = o[menuKey];

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[8vh]" role="dialog" aria-modal="true" aria-labelledby="os-playbook-title">
      <button type="button" className="absolute inset-0 bg-[#141312]/45 border-0 cursor-pointer" onClick={onClose} aria-label={o.hidePlaybook} />
      <div className="relative z-10 w-full max-w-[720px] max-h-[80vh] overflow-auto bg-white border border-text p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="kicker text-accent-800">
              {PLAYBOOK_CODE[menuKey]} {o.playbook}
            </div>
            <h2 id="os-playbook-title" className="mt-1 text-[22px] tracking-[-0.02em]">
              {title}
            </h2>
          </div>
          <button type="button" className="os-topbtn border border-divider shrink-0" onClick={onClose}>
            {o.hidePlaybook}
          </button>
        </div>
        <p className="mt-3 text-[14px] text-neutral-800">{book.goal}</p>
        <ol className="mt-5 flex flex-col gap-4 list-none p-0 m-0">
          {book.steps.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] leading-none text-accent-800 w-6 shrink-0">{s.n}</span>
              <div>
                <div className="font-extrabold text-[14px]">{s.t}</div>
                <p className="mt-1 text-[13px] leading-[1.45] text-neutral-700">{s.b}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 pt-4 border-t border-divider text-[12px] text-neutral-700">
          <span className="font-extrabold">{o.playbookWatch}: </span>
          {book.watch}
        </p>
        <p className="mt-2 text-[12px] text-neutral-700">
          <span className="font-extrabold">{o.playbookAi}: </span>
          {book.ai}
        </p>
      </div>
    </div>
  );
}
