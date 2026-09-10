"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { menuPlaybook, type MenuKey } from "@/lib/os/playbook";

export default function PlaybookPanel({
  menuKey,
  open,
  onToggle,
}: {
  menuKey: MenuKey;
  open: boolean;
  onToggle: () => void;
}) {
  const { lang } = useApp();
  const { o } = useOs();
  const book = menuPlaybook(lang, menuKey);
  const title = o[menuKey];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return <section className="border-2 border-divider mb-5 min-h-[56px] bg-surface" aria-hidden />;
  }

  return (
    <section className="border-2 border-divider mb-5 bg-bg">
      <div className="flex flex-wrap items-start justify-between gap-2 px-3.5 py-3 border-b-2 border-divider bg-surface">
        <div className="min-w-0">
          <div className="kicker">{o.playbook}</div>
          <div className="font-[family-name:var(--font-heading)] font-extrabold text-[20px] leading-none mt-1">
            {title}
          </div>
        </div>
        <button type="button" className="btn btn-secondary" onClick={onToggle}>
          {open ? o.hidePlaybook : o.showPlaybook}
        </button>
      </div>
      {open && (
        <div className="p-3.5 flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Note k={o.playbookGoal} v={book.goal} />
            <Note k={o.playbookWatch} v={book.watch} warn />
            <Note k={o.playbookAi} v={book.ai} />
          </div>
          <div>
            <div className="microlabel mb-2">{o.playbookSteps}</div>
            <ol className="grid grid-cols-1 md:grid-cols-2 border-2 border-divider">
              {book.steps.map((s) => (
                <li key={s.n} className="p-3.5 border-t-2 md:border-t-0 md:border-l-2 border-divider first:border-l-0 first:border-t-0 md:[&:nth-child(2)]:border-l-2 md:[&:nth-child(-n+2)]:border-t-0 md:[&:nth-child(n+3)]:border-t-2 list-none">
                  <div className="flex gap-2 items-baseline">
                    <span className="font-[family-name:var(--font-heading)] font-extrabold text-[22px] text-accent-800 leading-none">{s.n}</span>
                    <span className="font-extrabold text-[14px]">{s.t}</span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-[1.45] text-neutral-800">{s.b}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </section>
  );
}

function Note({ k, v, warn }: { k: string; v: string; warn?: boolean }) {
  return (
    <div className={`p-3 border-2 ${warn ? "border-text bg-accent-100" : "border-divider"}`}>
      <div className="microlabel mb-1">{k}</div>
      <p className="text-[13px] leading-[1.4]">{v}</p>
    </div>
  );
}
