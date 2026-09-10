"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { ImpactCard, LocText } from "./ui";

export default function DemoBar() {
  const { L } = useApp();
  const { o, snap, addFive, delayFlight, approve, closeTrip } = useOs();
  const impact = snap.impacts[0];
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-secondary" onClick={addFive} disabled={["paxAdded", "disrupted", "approved", "closed"].includes(snap.demoStage)}>
          {o.add5}
        </button>
        <button type="button" className="btn btn-secondary" onClick={delayFlight} disabled={snap.demoStage === "allocated" || snap.demoStage === "closed"}>
          {o.delay}
        </button>
        <button type="button" className="btn btn-primary" onClick={approve} disabled={!snap.approvals.some((a) => a.status === "pending")}>
          {o.approve}
        </button>
        <button type="button" className="btn btn-secondary" onClick={closeTrip} disabled={snap.demoStage !== "approved"}>
          {o.close}
        </button>
      </div>
      {impact && (
        <ImpactCard
          title={<LocText v={impact.title} />}
          why={<LocText v={impact.why} />}
          finance={<LocText v={impact.finance} />}
          next={<LocText v={impact.next} />}
        />
      )}
      {snap.approvals.filter((a) => a.status === "pending").length > 0 && (
        <div className="text-[13px] text-accent-800 font-extrabold">
          {o.await}: {snap.approvals.filter((a) => a.status === "pending").map((a) => L(a.title)).join(" · ")}
        </div>
      )}
    </div>
  );
}
