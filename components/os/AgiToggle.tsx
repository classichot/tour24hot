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
    <div className="inline-flex items-center" role="group" aria-label={a.agi}>
      <button type="button" className={`os-topbtn ${!agi.on ? "is-on" : ""}`} onClick={() => turn(false)}>
        {a.normalAi}
      </button>
      <button type="button" className={`t24-agi-on os-topbtn ${agi.on ? "is-on" : ""}`} onClick={() => turn(true)}>
        {a.agi}
      </button>
    </div>
  );
}
