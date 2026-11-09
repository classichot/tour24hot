"use client";

import Link from "next/link";
import { useOs } from "@/lib/os/store";

export default function PortalsHubPage() {
  const { o } = useOs();
  const cards = [
    [o.traveler, "/portal/traveler", "Itinerary, vouchers, document tasks, payment status."],
    [o.organiser, "/portal/organiser", "Group list, rooming, add names, see change notices."],
    [o.supplier, "/portal/supplier", "Confirm or decline a service from a secure link."],
    [o.guide, "/portal/guide", "Manifest, briefing, tasks, incident report."],
  ] as const;
  return (
    <main className="flex flex-col gap-5">
      <div>
        <div className="kicker">{o.portals}</div>
        <h1 className="mt-1 text-[clamp(26px,3vw,40px)]">Mobile portals</h1>
        <p className="mt-2 text-[14px] max-w-[640px]">Thai and English via the language switcher. Suppliers stay on a short secure page — no full workspace login.</p>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
        {cards.map(([title, href, body]) => (
          <Link key={href} href={href} className="border-2 border-divider p-4 no-underline text-text hover:border-text">
            <div className="font-extrabold text-[18px]">{title}</div>
            <p className="text-[13px] mt-1 text-neutral-800">{body}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
