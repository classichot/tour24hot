"use client";

import { useRouter } from "next/navigation";
import { useOs } from "@/lib/os/store";

export default function AgiToggle() {
  const router = useRouter();
  const { a, agi, setAgiOn } = useOs();

  function turn(on: boolean) {
    setAgiOn(on);
    if (on) router.push("/os/agi");
  }

  return (
    <div className="inline-flex border-2 border-text" role="group" aria-label={a.agi}>
      <button
        type="button"
        className={`px-2.5 py-1.5 text-[11px] font-extrabold border-0 ${!agi.on ? "bg-surface text-text" : "bg-transparent text-neutral-700"}`}
        onClick={() => turn(false)}
      >
        {a.normalAi}
      </button>
      <button
        type="button"
        className={`t24-agi-on px-2.5 py-1.5 text-[11px] font-extrabold border-0 ${agi.on ? "bg-accent text-text" : "bg-transparent text-neutral-700"}`}
        onClick={() => turn(true)}
      >
        {a.agi}
      </button>
    </div>
  );
}
