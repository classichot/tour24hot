"use client";

import IosShell from "@/components/ios/IosShell";
import { IosProvider } from "@/lib/ios/store";

export default function InboundOsLayout({ children }: { children: React.ReactNode }) {
  return (
    <IosProvider>
      <IosShell>{children}</IosShell>
    </IosProvider>
  );
}
