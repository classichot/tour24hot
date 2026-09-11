import { Suspense } from "react";
import TourCatalog from "@/components/TourCatalog";

export default function InboundPage() {
  return (
    <Suspense fallback={<main className="max-w-[1400px] mx-auto px-[22px] pt-[22px]" />}>
      <TourCatalog mode="inbound" />
    </Suspense>
  );
}
