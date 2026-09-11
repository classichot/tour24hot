"use client";

import AgencyWorkspace from "@/components/AgencyWorkspace";
import { useInboundScope } from "@/lib/store";

export default function InboundAgencyPage() {
  useInboundScope(true);
  return <AgencyWorkspace inbound />;
}
