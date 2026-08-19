"use client";

import { useApp } from "@/lib/store";

export default function AgentBadge({ compact = false }: { compact?: boolean }) {
  const { t } = useApp();
  return (
    <span className="bg-text text-bg text-[10px] font-extrabold tracking-[0.08em] uppercase px-[9px] py-1">
      ✓ {compact ? t.agntBadgeShort : t.agntBadge}
    </span>
  );
}
