"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/lib/store";
import { ROLE_INFO } from "@/lib/auth/session";
import { signOut, useMember } from "@/lib/auth/client";
import { AU } from "./copy";

/** Header control: "Sign in" when signed out; the member's name with a small menu when signed in. */
export default function AccountMenu({ dark = false }: { dark?: boolean }) {
  const { L, inboundMode } = useApp();
  const member = useMember();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!member) {
    return (
      <Link
        href={`/login?role=${inboundMode ? "in-buyer" : "out-buyer"}`}
        className={`shrink-0 whitespace-nowrap px-2.5 py-1 text-[12px] font-extrabold no-underline ${dark ? "bg-[#ffc61a] text-[#141312]" : "bg-text text-bg"}`}
      >
        {L(AU.signInShort)}
      </Link>
    );
  }

  const info = ROLE_INFO[member.role];
  return (
    <div ref={box} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex cursor-pointer items-center gap-1.5 border px-1.5 py-0.5 text-[12px] font-extrabold ${dark ? "border-white/25 bg-transparent text-[#f3f2f2]" : "border-divider bg-bg text-text hover:bg-surface"}`}
      >
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#ffc61a] text-[11px] text-[#141312]">{member.name.slice(0, 1)}</span>
        <span className="max-w-[90px] truncate">{member.name.split(" ")[0]}</span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div role="menu" className={`absolute right-0 z-[80] mt-1 w-[240px] border border-text bg-bg p-3 text-text shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${dark ? "bottom-full mb-1" : "top-full"}`}>
          <div className="text-[14px] font-extrabold">{member.name}</div>
          <div className="text-[12px] text-neutral-700">{L(info.title)}</div>
          {member.org && <div className="text-[12px] text-neutral-700">{member.org}</div>}
          <div className="mt-1 truncate font-mono text-[11px] text-neutral-600">{member.email}</div>
          <div className="mt-3 flex flex-col gap-1.5">
            {path !== info.home && (
              <Link role="menuitem" href={info.home} onClick={() => setOpen(false)} className="btn btn-primary no-underline text-[13px]">
                {L(AU.mySpace)}
              </Link>
            )}
            <button
              role="menuitem"
              type="button"
              className="btn btn-secondary text-[13px]"
              onClick={async () => {
                setOpen(false);
                await signOut();
                router.push("/login");
                router.refresh();
              }}
            >
              {L(AU.signOut)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
