"use client";

import Link from "next/link";
import AgentPlayground from "@/components/AgentPlayground";
import { useApp } from "@/lib/store";

export default function AgentsPublicPage() {
  const { t } = useApp();
  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <section className="pt-[22px] pb-8 border-b-2 border-divider max-w-[760px]">
        <div className="kicker">{t.agntKicker}</div>
        <h1 className="mt-2 text-[clamp(32px,4.2vw,54px)] leading-[1.02] [text-wrap:pretty]">{t.agntHeroTitle}</h1>
        <p className="mt-3 text-base text-neutral-800 max-w-[620px]">{t.agntHeroSub}</p>
        <div className="mt-4 flex gap-2 flex-wrap">
          <Link href="/agent-direct" className="btn btn-secondary no-underline">
            {t.agntHomeDev}
          </Link>
          <Link href="/agent.json" className="btn btn-ghost no-underline">
            /agent.json
          </Link>
        </div>
      </section>
      <section className="pt-8">
        <AgentPlayground />
      </section>
    </main>
  );
}
