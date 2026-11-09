"use client";

import OsShell from "@/components/os/OsShell";
import { OsProvider } from "@/lib/os/store";

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <OsProvider>
      <OsShell>{children}</OsShell>
    </OsProvider>
  );
}
