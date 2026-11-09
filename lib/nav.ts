import type { Dict } from "./i18n";

/**
 * Marketplace menu, one source for both the site header and the Control Center.
 * Add, rename or reorder a section here and both update together.
 */
export type NavDir = "outbound" | "inbound";

/** What the Control Center manages for a section. */
export type NavKind = "catalog" | "daytour" | "excursion" | "attraction" | "deals" | "advisor" | "agents" | "group" | "trips" | "agency";

export interface NavItem {
  id: string;
  dir: NavDir;
  kind: NavKind;
  href: string;
  label: keyof Dict;
  active: (path: string, inboundMode: boolean) => boolean;
}

const starts = (p: string, prefix: string) => p.startsWith(prefix);

export const NAV: Record<NavDir, NavItem[]> = {
  outbound: [
    { id: "out-tours", dir: "outbound", kind: "catalog", href: "/search?dir=outbound", label: "navSearch", active: (p, inb) => p === "/search" && !inb },
    { id: "out-advisor", dir: "outbound", kind: "advisor", href: "/advisor?dir=outbound", label: "navAdvisor", active: (p) => starts(p, "/advisor") || starts(p, "/match") },
    { id: "out-agents", dir: "outbound", kind: "agents", href: "/agents?dir=outbound", label: "navAgents", active: (p) => starts(p, "/agents") || starts(p, "/agent-direct") },
    { id: "out-group", dir: "outbound", kind: "group", href: "/group?dir=outbound", label: "navGroup", active: (p) => p === "/group" },
    { id: "out-trips", dir: "outbound", kind: "trips", href: "/trips?dir=outbound", label: "navTrips", active: (p) => p === "/trips" },
    { id: "out-burn", dir: "outbound", kind: "deals", href: "/burn?dir=outbound", label: "navBurn", active: (p) => p === "/burn" },
    { id: "out-agency", dir: "outbound", kind: "agency", href: "/agency", label: "navOutAgency", active: (p) => starts(p, "/agency") },
  ],
  inbound: [
    { id: "in-tours", dir: "inbound", kind: "catalog", href: "/inbound", label: "navInbound", active: (p, inb) => p === "/inbound" || (p === "/search" && inb) },
    { id: "in-daytours", dir: "inbound", kind: "daytour", href: "/inbound/day-tours", label: "navInDayTours", active: (p) => starts(p, "/inbound/day-tours") },
    { id: "in-excursions", dir: "inbound", kind: "excursion", href: "/inbound/excursions", label: "navInExcursions", active: (p) => starts(p, "/inbound/excursions") },
    { id: "in-attractions", dir: "inbound", kind: "attraction", href: "/inbound/attractions", label: "navInAttractions", active: (p) => starts(p, "/inbound/attractions") },
    { id: "in-advisor", dir: "inbound", kind: "advisor", href: "/advisor?dir=inbound", label: "navInAdvisor", active: (p) => starts(p, "/advisor") || starts(p, "/match") },
    { id: "in-agents", dir: "inbound", kind: "agents", href: "/agents?dir=inbound", label: "navInAgents", active: (p) => starts(p, "/agents") || starts(p, "/agent-direct") },
    { id: "in-group", dir: "inbound", kind: "group", href: "/group?dir=inbound", label: "navInGroup", active: (p) => p === "/group" },
    { id: "in-trips", dir: "inbound", kind: "trips", href: "/trips?dir=inbound", label: "navInTrips", active: (p) => p === "/trips" },
    { id: "in-agency", dir: "inbound", kind: "agency", href: "/inbound/agency", label: "navInAgency", active: (p) => starts(p, "/inbound/agency") },
  ],
};

export const navItem = (id: string) => [...NAV.outbound, ...NAV.inbound].find((n) => n.id === id);
