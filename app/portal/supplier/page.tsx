"use client";

import { useApp } from "@/lib/store";
import { useOs } from "@/lib/os/store";
import { LocText, Pill } from "@/components/os/ui";

export default function SupplierPortal() {
  const { L } = useApp();
  const { snap, confirmService } = useOs();
  const meal = snap.services.find((s) => s.id === "svc-meal-d2")!;
  return (
    <main className="flex flex-col gap-4">
      <div className="kicker">Secure supplier link</div>
      <h1 className="text-[28px]">Asakusa Table</h1>
      <p className="text-[14px]">
        <LocText v={meal.name} /> · {meal.qty} heads · {meal.state}
      </p>
      <Pill tone="warn">{meal.notes ? L(meal.notes) : meal.rateClass}</Pill>
      <button type="button" className="btn btn-primary" onClick={() => confirmService(meal.id)}>
        Confirm this service
      </button>
      <p className="text-[12px] text-neutral-700">No workspace login. This link only shows the meal you were asked to confirm.</p>
    </main>
  );
}
