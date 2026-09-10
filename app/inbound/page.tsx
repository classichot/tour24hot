"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { DATA, inboundPackages } from "@/lib/data";
import { useApp, useInboundScope } from "@/lib/store";
import PackageCard from "@/components/PackageCard";
import PhotoSlot from "@/components/PhotoSlot";
import { destPhoto } from "@/lib/photos";
import { Check } from "@/components/icons";

export default function InboundPage() {
  const { t, L, money } = useApp();
  const router = useRouter();
  useInboundScope(true);
  const pkgs = inboundPackages();

  return (
    <main className="max-w-[1400px] mx-auto px-[22px] pb-20">
      <section className="pt-[22px] pb-8 border-b-2 border-divider grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-6 items-end">
        <div>
          <div className="kicker">{t.inbKicker}</div>
          <h1 className="mt-2 text-[clamp(28px,3.8vw,50px)] leading-[1.03] [text-wrap:pretty]">{t.inbTitle}</h1>
          <p className="mt-3 text-base text-neutral-800 max-w-[560px]">{t.inbSub}</p>
          <p className="mt-2 text-[12px] text-neutral-700">{t.inbLangHint}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/search?dir=inbound&country=Thailand" className="btn btn-primary no-underline">
            {t.inbCta}
          </Link>
          <Link href="/agents" className="btn btn-secondary no-underline">
            {t.navAgents}
          </Link>
        </div>
      </section>

      <section className="pt-8">
        <h2 className="mb-1 text-[clamp(22px,2.6vw,30px)]">{t.inbRegions}</h2>
        <p className="mb-4 text-[13px] text-neutral-700 max-w-[620px]">{t.inbRegionsSub}</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] border-2 border-divider">
          {DATA.inboundRegions.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => router.push(`/search?dir=inbound&q=${encodeURIComponent(d.q)}`)}
              className="bg-bg border border-divider p-0 cursor-pointer text-left text-text"
            >
              <div className="aspect-[5/4] relative bg-surface">
                <PhotoSlot label={L(d.name)} src={destPhoto(d.id)} />
              </div>
              <div className="px-3 pt-2.5 pb-3">
                <div className="font-[family-name:var(--font-heading)] font-extrabold text-lg">{L(d.name)}</div>
                <div className="text-[11px] text-neutral-700">
                  {d.count} {t.resultsIn} · {t.from} {money(d.from)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="pt-10">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-4 border-b-2 border-divider pb-2.5">
          <div>
            <h2 className="mb-1 text-[clamp(22px,2.6vw,30px)]">{t.inbPackages}</h2>
            <p className="text-[13px] text-neutral-700 max-w-[640px]">{t.inbPackagesSub}</p>
          </div>
          <Link href="/search?dir=inbound" className="btn btn-ghost no-underline">
            {t.seeAll}
          </Link>
        </div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(310px,1fr))] gap-[18px]">
          {pkgs.map((p) => (
            <PackageCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="pt-10">
        <h2 className="mb-4 text-[clamp(22px,2.6vw,30px)]">{t.inbHow}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
          {[
            { n: "01", title: t.inbHow1t, body: t.inbHow1b },
            { n: "02", title: t.inbHow2t, body: t.inbHow2b },
            { n: "03", title: t.inbHow3t, body: t.inbHow3b },
            { n: "04", title: t.inbHow4t, body: t.inbHow4b },
          ].map((h) => (
            <div key={h.n} className="bg-bg border border-divider px-4 pt-[18px] pb-5 flex flex-col gap-2">
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-[13px] text-accent-700">{h.n}</div>
              <div className="font-[family-name:var(--font-heading)] font-extrabold text-lg leading-[1.15]">{h.title}</div>
              <p className="text-[13px] text-neutral-800">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-8">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[2px] bg-divider border-2 border-divider">
          {[t.inboundGuide, t.inboundMarket, t.landPackage, t.noShopFlag].map((v) => (
            <div key={v} className="bg-bg px-3.5 py-3 flex gap-2 items-center text-[13px]">
              <Check className="flex-none" stroke="var(--color-accent-700)" />
              <span>{v}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
