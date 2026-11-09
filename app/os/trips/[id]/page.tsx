"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useIos } from "@/lib/ios/store";
import TripHeader from "@/components/ios/trip/TripHeader";
import Overview from "@/components/ios/trip/Overview";
import Itinerary from "@/components/ios/trip/Itinerary";
import Money from "@/components/ios/trip/Money";
import Files from "@/components/ios/trip/Files";
import Bookings from "@/components/ios/trip/Bookings";
import Guests from "@/components/ios/trip/Guests";
import { Tabs, btn } from "@/components/ios/ui";
import { can, confirmedQty, allServices, type TripTab } from "@/lib/ios/rules";

const TABS: TripTab[] = ["overview", "itinerary", "bookings", "guests", "money", "files"];

/** One detail route per TripFile, from enquiry to close (NAV05). Tab and quote live in the URL so deep links work. */
export default function TripWorkspacePage() {
  const { state, me } = useIos();
  const params = useParams();
  const search = useSearchParams();
  const trip = state.trips.find((t) => t.id === String(params.id));
  const asked = (TABS.includes(search.get("tab") as TripTab) ? search.get("tab") : "overview") as TripTab;
  const showGuests = can(me, "guest.view");
  const tab: TripTab = asked === "guests" && !showGuests ? "overview" : asked;

  if (!trip) {
    // Non-disclosing: the same message whether it never existed or is not yours to see (AT14).
    return (
      <div className="mx-auto max-w-[560px] rounded-[8px] border border-[#dcd9d6] bg-white p-8">
        <h1 className="text-[24px] font-extrabold">Trip not available</h1>
        <p className="mt-2 text-[16px] text-[#5b5754]">This trip does not exist in your company workspace, or you do not have access to it.</p>
        <Link href="/os/sales" className={`${btn.secondary} mt-4`}>Back to Sales</Link>
      </div>
    );
  }

  const services = trip.itinerary.reduce((a, d) => a + d.services.length, 0);
  const svcList = allServices(trip);
  const confirmed = svcList.filter(({ s }) => s.mandatory && confirmedQty(trip, s) >= s.qty).length;
  const booked = trip.commercial === "booked";

  return (
    <div className="flex flex-col gap-5">
      <TripHeader trip={trip} />
      <Tabs
        active={tab}
        items={[
          { key: "overview", label: "Overview", href: "?tab=overview" },
          { key: "itinerary", label: "Itinerary", href: "?tab=itinerary", count: services },
          ...(booked ? [{ key: "bookings", label: "Bookings", href: "?tab=bookings", count: confirmed }] : []),
          ...(booked && showGuests ? [{ key: "guests", label: "Guests", href: "?tab=guests", count: trip.guests.length }] : []),
          { key: "money", label: "Money", href: "?tab=money", count: trip.quotes.length },
          { key: "files", label: "Messages and files", href: "?tab=files", count: trip.notes.length + trip.documents.filter((d) => d.status === "issued").length },
        ]}
      />
      {tab === "overview" && <Overview key={trip.id} trip={trip} />}
      {tab === "itinerary" && <Itinerary key={trip.id} trip={trip} />}
      {tab === "bookings" && <Bookings key={trip.id} trip={trip} />}
      {tab === "guests" && <Guests key={trip.id} trip={trip} />}
      {tab === "money" && <Money key={trip.id} trip={trip} quoteId={search.get("quote") ?? undefined} />}
      {tab === "files" && <Files key={trip.id} trip={trip} />}
    </div>
  );
}
