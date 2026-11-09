"use client";

import HostShell from "@/components/host/HostShell";
import { HostProvider } from "@/lib/host/store";

export default function HostLayout({ children }: { children: React.ReactNode }) {
  return (
    <HostProvider>
      <HostShell>{children}</HostShell>
    </HostProvider>
  );
}
