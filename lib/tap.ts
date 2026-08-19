/** Tour Agent Protocol (TAP) — TOUR24 Agent Direct.
 *  Machine-readable commerce gateway: discover, compare, hold, book
 *  verified tour operators. Same inventory as the human marketplace.
 */

import { agencyById, DATA, pkgById, type Pkg } from "./data";

export const TAP_VERSION = "0.1.0";

export type TapToolName =
  | "discover"
  | "search"
  | "get_package"
  | "compare"
  | "availability"
  | "get_price"
  | "quote"
  | "reserve"
  | "book"
  | "cancel"
  | "modify"
  | "status"
  | "demand"
  | "pay"
  | "review"
  | "get_agency_identity";

export type TapAgencyProfile = {
  tour24Id: string;
  destinations: string[];
  languages: string[];
  origin: string;
  instantBooking: boolean;
  liveInventory: boolean;
  agentDirect: boolean;
  insurance: boolean;
  payments: string[];
};

export const TAP_AGENCIES: Record<string, TapAgencyProfile> = {
  siam: {
    tour24Id: "TH-SIAM-00231",
    destinations: ["Japan", "China"],
    languages: ["Thai", "English"],
    origin: "Thailand",
    instantBooking: true,
    liveInventory: true,
    agentDirect: true,
    insurance: true,
    payments: ["promptpay", "credit_card", "bank_transfer"],
  },
  orient: {
    tour24Id: "TH-ORIENT-00074",
    destinations: ["Japan", "Korea", "Taiwan"],
    languages: ["Thai", "English", "Japanese"],
    origin: "Thailand",
    instantBooking: true,
    liveInventory: true,
    agentDirect: true,
    insurance: true,
    payments: ["promptpay", "credit_card"],
  },
  vela: {
    tour24Id: "TH-VELA-00105",
    destinations: ["Japan", "Korea", "China", "Taiwan"],
    languages: ["Thai", "English"],
    origin: "Thailand",
    instantBooking: true,
    liveInventory: true,
    agentDirect: true,
    insurance: true,
    payments: ["promptpay", "credit_card"],
  },
  nakara: {
    tour24Id: "TH-NAKARA-00112",
    destinations: ["China", "Vietnam"],
    languages: ["Thai", "English", "Chinese"],
    origin: "Thailand",
    instantBooking: false,
    liveInventory: true,
    agentDirect: true,
    insurance: true,
    payments: ["promptpay", "bank_transfer"],
  },
  bkkjet: {
    tour24Id: "TH-BKKJET-00120",
    destinations: ["Korea", "Vietnam"],
    languages: ["Thai"],
    origin: "Thailand",
    instantBooking: false,
    liveInventory: false,
    agentDirect: false,
    insurance: false,
    payments: ["bank_transfer"],
  },
};

export function isAgentDirect(agencyId: string) {
  return TAP_AGENCIES[agencyId]?.agentDirect === true;
}

export type TapOffer = {
  package_id: string;
  code: string;
  title: string;
  country: string;
  cities: string;
  duration_days: number;
  duration_nights: number;
  advertised_price: number;
  real_total: number;
  currency: "THB";
  airline: string;
  airline_type: string;
  direct_flight: boolean;
  hotel_class: number;
  hotel_names: string[];
  meals: number;
  attractions: number;
  free_days: number;
  shopping_stops: number;
  compulsory_shopping: boolean;
  guide_language: "Thai";
  group_size: number;
  visa: number;
  baggage: string;
  deposit: number;
  cancellation: string;
  seats: number;
  departure: string;
  departure_status: string;
  agency_id: string;
  agency_name: string;
  agency_tour24_id: string;
  trust_score: number;
  agent_direct: boolean;
  instant_booking: boolean;
};

export type TapHold = {
  hold_id: string;
  package_id: string;
  departure_index: number;
  pax: number;
  expires: string;
  total: number;
  status: "held" | "converted" | "expired";
};

export type TapBooking = {
  booking_id: string;
  hold_id?: string;
  package_id: string;
  agency_id: string;
  guest: string;
  pax: number;
  total: number;
  deposit: number;
  pay: "PromptPay" | "Card";
  status: "confirmed" | "cancelled" | "modified";
  channel: "TOUR24 Agent Direct";
  merchant_of_record: string;
  ota_involved: false;
  fee_pct: number;
};

const g = globalThis as unknown as {
  __tapHolds?: Map<string, TapHold>;
  __tapBooks?: Map<string, TapBooking>;
};
function holds() {
  if (!g.__tapHolds) g.__tapHolds = new Map();
  return g.__tapHolds;
}
function books() {
  if (!g.__tapBooks) g.__tapBooks = new Map();
  return g.__tapBooks;
}

export function toAgentOffer(p: Pkg, lang: "en" | "th" = "en"): TapOffer | null {
  const ag = agencyById(p.agency);
  const tap = TAP_AGENCIES[p.agency];
  if (!ag || !tap) return null;
  const dep = p.departures.find((d) => d.status !== "sold" && d.seats > 0) || p.departures[0];
  const loc = (v: { th: string; en: string } | string) => (typeof v === "string" ? v : v[lang]);
  return {
    package_id: p.id,
    code: p.code,
    title: loc(p.title),
    country: loc(p.country),
    cities: loc(p.city),
    duration_days: p.days,
    duration_nights: p.nights,
    advertised_price: p.price,
    real_total: p.real,
    currency: "THB",
    airline: p.airlineName,
    airline_type: p.airlineType,
    direct_flight: p.direct,
    hotel_class: p.hotelStar,
    hotel_names: p.hotels.map((h) => loc(h.name)),
    meals: p.meals,
    attractions: p.attractions,
    free_days: p.freeDays,
    shopping_stops: p.shopping,
    compulsory_shopping: p.shopping > 0,
    guide_language: "Thai",
    group_size: p.group,
    visa: p.visa,
    baggage: p.baggage,
    deposit: 5000,
    cancellation: loc(p.cancel),
    seats: dep.seats,
    departure: loc(dep.date),
    departure_status: dep.status,
    agency_id: ag.id,
    agency_name: loc(ag.name),
    agency_tour24_id: tap.tour24Id,
    trust_score: ag.trust,
    agent_direct: tap.agentDirect,
    instant_booking: tap.instantBooking,
  };
}

export const TAP_TOOLS: { name: TapToolName; description: string; input: Record<string, string> }[] = [
  { name: "discover", description: "Verified TOUR24 agency registry with Agent Direct status.", input: { destination: "string?" } },
  { name: "search", description: "Search normalized live packages. Filters: destination, duration, budget, shopping, guide language.", input: { origin: "string?", destination: "string?", duration_min: "number?", duration_max: "number?", budget_max: "number?", shopping_stops: "number?", guide_language: "string?" } },
  { name: "get_package", description: "Full standardized package schema for one tour.", input: { package_id: "string" } },
  { name: "compare", description: "Normalize 2–4 packages and explain the real-cost gap.", input: { package_ids: "string[]" } },
  { name: "availability", description: "Live seats by departure for a package.", input: { package_id: "string" } },
  { name: "get_price", description: "Advertised vs real total, deposit, single supplement.", input: { package_id: "string" } },
  { name: "quote", description: "Priced quote for N adults before a hold.", input: { package_id: "string", pax: "number?" } },
  { name: "reserve", description: "Hold seats 15 minutes. Does not charge.", input: { package_id: "string", pax: "number?", departure_index: "number?" } },
  { name: "book", description: "Convert a hold into an Agent Direct booking. Agency owns the traveler.", input: { hold_id: "string", guest: "string" } },
  { name: "cancel", description: "Cancel an Agent Direct booking and restore seats.", input: { booking_id: "string" } },
  { name: "modify", description: "Change pax on a held or booked reservation.", input: { booking_id: "string", pax: "number" } },
  { name: "status", description: "Look up hold or booking status.", input: { hold_id: "string?", booking_id: "string?" } },
  { name: "demand", description: "Unmet AI search demand vs available seats — operator intelligence.", input: { destination: "string?" } },
  { name: "pay", description: "Collect deposit on a held booking (PromptPay / card). Same as book with a payment method.", input: { hold_id: "string", guest: "string?", method: "string?" } },
  { name: "review", description: "Verified traveler reviews for Agent Direct bookings.", input: { package_id: "string?" } },
  { name: "get_agency_identity", description: "The tour24.json / agent.json identity document for an agency.", input: { agency_id: "string?" } },
];

export const TAP_ENDPOINTS = [
  { method: "GET", path: "/agent.json", use: "Network identity — analog of robots.txt for AI commerce" },
  { method: "GET", path: "/.well-known/tour24.json", use: "Merchant identity for a verified agency" },
  { method: "GET", path: "/api/agent/discover", use: "Registry of Agent Direct operators" },
  { method: "GET", path: "/api/agent/search", use: "Structured inventory search" },
  { method: "GET", path: "/api/agent/package/:id", use: "Normalized package schema" },
  { method: "POST", path: "/api/agent/compare", use: "Side-by-side compare engine" },
  { method: "POST", path: "/api/agent/reserve", use: "15-minute seat hold" },
  { method: "POST", path: "/api/agent/book", use: "Confirm booking · agency is merchant of record" },
  { method: "POST", path: "/api/agent/quote", use: "Priced quote for N adults" },
  { method: "POST", path: "/api/agent/pay", use: "Deposit / checkout on a hold" },
  { method: "GET", path: "/api/agent/demand", use: "Unmet AI demand vs seats" },
  { method: "GET", path: "/api/agent/mcp", use: "MCP tool manifest" },
  { method: "GET", path: "/api/agent/feed", use: "ACP-shaped inventory feed" },
  { method: "POST", path: "/api/agent/invoke", use: "Single MCP-style tool gateway" },
];

export const DEMAND = [
  { destination: "Japan", window: "October 2026", budget: "฿30,000–40,000", duration: "5–6 days", constraint: "No compulsory shopping", searches: 8420, seats: 1900, gap: 6520, action: { en: "Launch extra Tokyo/Fuji departures 12–18 Oct around ฿35,000–39,000.", th: "เปิดรอบโตเกียว/ฟูจิเพิ่ม 12–18 ต.ค. ราว ฿35,000–39,000" } },
  { destination: "Korea", window: "October 2026", budget: "฿18,000–25,000", duration: "5 days", constraint: "Family pace", searches: 3110, seats: 2460, gap: 650, action: { en: "Demand is covered. Keep Busan no-shop inventory live.", th: "ที่นั่งพอแล้ว คงคลังปูซานไม่ลงร้านไว้" } },
  { destination: "Taiwan", window: "November 2026", budget: "฿18,000–22,000", duration: "5 days", constraint: "Direct flight", searches: 1980, seats: 420, gap: 1560, action: { en: "Add one Taipei 5D3N direct-flight departure in early November.", th: "เพิ่มรอบไทเป 5 วันบินตรงต้นพฤศจิกายน" } },
];

export const SAMPLE_QUERIES = [
  {
    id: "jp",
    en: "Find me a Japan autumn tour from Bangkok around ฿40,000, 5–7 days, Thai-speaking guide, no compulsory shopping.",
    th: "หาทัวร์ญี่ปุ่นจากกรุงเทพ ราว ฿40,000 5–7 วัน ไกด์ภาษาไทย ไม่มีร้านช้อปบังคับ",
    args: { origin: "Bangkok", destination: "Japan", duration_min: 5, duration_max: 7, budget_max: 45000, shopping_stops: 0, guide_language: "Thai" },
  },
  {
    id: "kr",
    en: "Korea 5 days, family with children, around ฿28,000, prefer no shopping.",
    th: "เกาหลี 5 วัน พาเด็ก งบราว ฿28,000 อยากไม่ลงร้าน",
    args: { origin: "Bangkok", destination: "Korea", duration_min: 5, duration_max: 6, budget_max: 30000, shopping_stops: 0 },
  },
  {
    id: "hk",
    en: "Hokkaido snow tour around ฿45,000, 6 days, full-service airline.",
    th: "ทัวร์หิมะฮอกไกโดราว ฿45,000 6 วัน สายการบินฟูลเซอร์วิส",
    args: { origin: "Bangkok", destination: "Hokkaido", duration_min: 6, duration_max: 7, budget_max: 55000, airline_type: "full" },
  },
];

type Args = Record<string, unknown>;
function str(a: Args, k: string) {
  const v = a[k];
  return typeof v === "string" ? v : v == null ? "" : String(v);
}
function num(a: Args, k: string) {
  const v = a[k];
  if (typeof v === "number") return v;
  if (v === "" || v === undefined || v === null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function langOf(a: Args): "en" | "th" {
  return str(a, "lang") === "th" ? "th" : "en";
}
function loc(v: { th: string; en: string } | string, lang: "en" | "th") {
  return typeof v === "string" ? v : v[lang];
}

export function parseTapQuery(url: URL): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  url.searchParams.forEach((v, k) => {
    if (k === "tool") return;
    if (k === "package_ids") {
      args[k] = v.split(",").map((s) => s.trim()).filter(Boolean);
      return;
    }
    if (v === "true") args[k] = true;
    else if (v === "false") args[k] = false;
    else if (v !== "" && Number.isFinite(Number(v))) args[k] = Number(v);
    else args[k] = v;
  });
  return args;
}

export function tapOk(result: unknown) {
  return !(result && typeof result === "object" && "error" in result && (result as { error?: string }).error);
}

export function agentRegistry(destination = "") {
  const dest = destination.toLowerCase();
  return Object.entries(TAP_AGENCIES)
    .filter(([, tap]) => tap.agentDirect)
    .map(([id, tap]) => {
      const ag = agencyById(id);
      if (!ag) return null;
      const pkgs = DATA.packages.filter((p) => p.agency === id);
      if (dest && !tap.destinations.some((d) => d.toLowerCase() === dest) && !pkgs.some((p) => p.country.en.toLowerCase() === dest)) {
        return null;
      }
      return {
        agency_id: id,
        tour24_id: tap.tour24Id,
        name: ag.name.en,
        name_th: ag.name.th,
        licence: ag.licence,
        trust_score: ag.trust,
        years: ag.years,
        completed_bookings: ag.bookings,
        cancellation_rate: ag.cancelRate,
        rating: ag.rating,
        verification: {
          tourism_license: true,
          company_registration: true,
          insurance: tap.insurance,
          agent_direct: tap.agentDirect,
        },
        markets: { origin: tap.origin, destinations: tap.destinations },
        languages: tap.languages,
        booking: { instant_booking: tap.instantBooking, live_inventory: tap.liveInventory },
        payment: { currency: "THB", methods: tap.payments },
        live_packages: pkgs.length,
      };
    })
    .filter(Boolean);
}

export function buildTour24Json(agencyId: string, origin: string) {
  const tap = TAP_AGENCIES[agencyId] || TAP_AGENCIES.siam;
  const ag = agencyById(agencyId) || agencyById("siam")!;
  return {
    protocol: "TAP",
    version: TAP_VERSION,
    provider: "TOUR24",
    merchant: ag.name.en,
    tour24_id: tap.tour24Id,
    agent_direct: tap.agentDirect,
    verification: "verified",
    inventory: `${origin}/api/agent/search?agency=${agencyId}`,
    booking: tap.instantBooking ? "enabled" : "quote",
    payments: tap.payments,
    identity: `${origin}/.well-known/tour24.json?agency=${agencyId}`,
    invoke: `${origin}/api/agent/invoke`,
    network: `${origin}/agent.json`,
  };
}

export function buildAgentJson(origin: string) {
  return {
    name: "TOUR24 Agent Direct",
    protocol: "TAP",
    version: TAP_VERSION,
    provider: "TOUR24",
    vertical: "tours",
    network: "24 Agent Direct",
    description: "AI-native distribution and comparison infrastructure connecting travelers, AI agents and verified tour operators.",
    agent_direct: true,
    booking: "enabled",
    payments: ["promptpay", "visa", "mastercard", "bank_transfer"],
    verification: "verified",
    registry: `${origin}/api/agent/discover`,
    search: `${origin}/api/agent/search`,
    invoke: `${origin}/api/agent/invoke`,
    well_known: `${origin}/.well-known/tour24.json`,
    playground: `${origin}/agents`,
    adapters: ["Hotel24", "Tour24", "Shop24", "Jet24"],
    tools: TAP_TOOLS.map((t) => t.name),
  };
}

function searchPackages(a: Args) {
  const dest = str(a, "destination").toLowerCase();
  const dmin = num(a, "duration_min");
  const dmax = num(a, "duration_max");
  const budget = num(a, "budget_max") || 1e9;
  const shop = a.shopping_stops === undefined || a.shopping_stops === "" ? null : num(a, "shopping_stops");
  const agency = str(a, "agency");
  const guide = str(a, "guide_language").toLowerCase();
  const airline = str(a, "airline_type").toLowerCase();
  return DATA.packages.filter((p) => {
    const tap = TAP_AGENCIES[p.agency];
    if (!tap?.agentDirect) return false;
    if (agency && p.agency !== agency) return false;
    const hay = `${p.country.en} ${p.country.th} ${p.city.en} ${p.city.th} ${p.title.en} ${p.title.th}`.toLowerCase();
    if (dest && !hay.includes(dest)) return false;
    if (dmin && p.days < dmin) return false;
    if (dmax && p.days > dmax) return false;
    if (p.real > budget) return false;
    if (shop !== null && p.shopping > shop) return false;
    if (guide && !["thai", "th", "ไทย"].includes(guide)) return false;
    if (airline && airline !== p.airlineType) return false;
    return true;
  });
}

function confirmHold(args: Args, method?: string) {
  const hold = holds().get(str(args, "hold_id"));
  if (!hold || hold.status !== "held") return { error: "hold_not_found" };
  const p = pkgById(hold.package_id);
  if (!p) return { error: "package_not_found" };
  const ag = agencyById(p.agency);
  if (!ag) return { error: "agency_not_found" };
  hold.status = "converted";
  const booking_id = `T24-AG-${Date.now().toString(36).toUpperCase()}`;
  const pay: TapBooking["pay"] = method?.toLowerCase() === "card" || method?.toLowerCase() === "credit_card" ? "Card" : "PromptPay";
  const rec: TapBooking = {
    booking_id,
    hold_id: hold.hold_id,
    package_id: p.id,
    agency_id: p.agency,
    guest: str(args, "guest") || "AI traveler",
    pax: hold.pax,
    total: hold.total,
    deposit: 5000 * hold.pax,
    pay,
    status: "confirmed",
    channel: "TOUR24 Agent Direct",
    merchant_of_record: ag.name.en,
    ota_involved: false,
    fee_pct: 1.5,
  };
  books().set(booking_id, rec);
  return { ...rec, title: p.title.en, message: "The verified agency owns this traveler. Klook / KKday / Traveloka were not in the path." };
}

export function tapFeed() {
  const items = DATA.packages
    .filter((p) => isAgentDirect(p.agency))
    .map((p) => {
      const offer = toAgentOffer(p);
      const ag = agencyById(p.agency);
      if (!offer || !ag) return null;
      return {
        id: p.id,
        type: "travel.tour_package",
        merchant: ag.name.en,
        merchant_id: tapId(p.agency),
        title: p.title.en,
        price: { value: p.real, currency: "THB" },
        availability: offer.seats > 0 && offer.departure_status !== "sold" ? "in_stock" : "out_of_stock",
        checkout_url: `/packages/${p.id}`,
        attributes: {
          country: p.country.en,
          cities: p.city.en,
          duration_days: p.days,
          airline: p.airlineName,
          hotel_class: p.hotelStar,
          shopping_stops: p.shopping,
          trust_score: ag.trust,
          agent_direct: true,
        },
      };
    })
    .filter(Boolean);
  return { protocol: "acp-inspired", category: "Travel.TourPackage", merchant_of_record: "agency", provider: "TOUR24", items };
}

function tapId(agencyId: string) {
  return TAP_AGENCIES[agencyId]?.tour24Id || agencyId;
}

export function invokeTap(name: string, args: Args = {}, origin = "") {
  const lang = langOf(args);
  switch (name as TapToolName) {
    case "discover":
      return { registry: "registry.tour24.com", protocol: "TAP", count: agentRegistry(str(args, "destination")).length, agencies: agentRegistry(str(args, "destination")) };
    case "search": {
      const list = searchPackages(args).map((p) => toAgentOffer(p, lang)).filter(Boolean);
      return { count: list.length, currency: "THB", origin: str(args, "origin") || "Bangkok", offers: list };
    }
    case "get_package": {
      const p = pkgById(str(args, "package_id"));
      if (!p) return { error: "package_not_found" };
      const ag = agencyById(p.agency);
      if (!ag) return { error: "agency_not_found" };
      const offer = toAgentOffer(p, lang);
      return {
        ...offer,
        itinerary: p.itinerary.map((d) => ({ day: d.d, title: loc(d.title, lang), body: loc(d.body, lang), meals: d.meals })),
        hidden_costs: p.cost.map((c) => ({ label: loc(c.label, lang), amount: c.amt })),
        optional: p.optional.map((o) => ({ name: loc(o.name, lang), price: o.price })),
        trust_factors: ag.factors.map((f) => ({ label: loc(f.label, lang), score: f.score })),
      };
    }
    case "compare": {
      const ids = (Array.isArray(args.package_ids) ? args.package_ids : String(args.package_ids || "").split(",").filter(Boolean)) as string[];
      const cols = (ids.length ? ids : searchPackages(args).slice(0, 3).map((p) => p.id))
        .map((id) => pkgById(String(id)))
        .filter(Boolean) as Pkg[];
      if (cols.length < 2) return { error: "need_two_packages", packages: cols.map((p) => toAgentOffer(p, lang)).filter(Boolean) };
      const offers = cols.map((p) => toAgentOffer(p, lang)).filter(Boolean) as TapOffer[];
      const cheapest = [...offers].sort((a, b) => a.real_total - b.real_total)[0];
      const bestTrust = [...offers].sort((a, b) => b.trust_score - a.trust_score)[0];
      const noShop = offers.find((o) => o.shopping_stops === 0) || offers[0];
      const gap = Math.abs((offers[1]?.real_total || 0) - (offers[0]?.real_total || 0));
      return {
        packages: offers,
        winner: noShop.package_id,
        explanation: `${noShop.title} is the price-adjusted trust pick: trust ${noShop.trust_score}, ${noShop.shopping_stops} shopping stops, real total ฿${noShop.real_total.toLocaleString("en-US")}. Cheapest is ${cheapest.title} at ฿${cheapest.real_total.toLocaleString("en-US")}. Gap vs next option ฿${gap.toLocaleString("en-US")}. Highest trust is ${bestTrust.agency_name} (${bestTrust.trust_score}).`,
      };
    }
    case "availability": {
      const p = pkgById(str(args, "package_id"));
      if (!p) return { error: "package_not_found" };
      return {
        package_id: p.id,
        departures: p.departures.map((d, i) => ({ index: i, date: loc(d.date, lang), status: d.status, seats: d.seats, bookable: d.status !== "sold" && d.seats > 0 })),
      };
    }
    case "get_price": {
      const p = pkgById(str(args, "package_id"));
      if (!p) return { error: "package_not_found" };
      return { package_id: p.id, advertised: p.price, real_total: p.real, hidden_gap: p.real - p.price, deposit: 5000, single_supplement: 6500, currency: "THB", lines: p.cost.map((c) => ({ label: loc(c.label, lang), amount: c.amt })) };
    }
    case "quote": {
      const p = pkgById(str(args, "package_id"));
      if (!p) return { error: "package_not_found" };
      const ag = agencyById(p.agency);
      if (!ag) return { error: "agency_not_found" };
      const pax = Math.max(1, num(args, "pax") || 2);
      const tap = TAP_AGENCIES[p.agency];
      return {
        package_id: p.id,
        pax,
        per_person: p.real,
        total: p.real * pax,
        deposit: 5000 * pax,
        hold_window: "15 minutes",
        instant_booking: tap?.instantBooking ?? false,
        agency: loc(ag.name, lang),
        next: "reserve",
      };
    }
    case "reserve": {
      const p = pkgById(str(args, "package_id"));
      if (!p) return { error: "package_not_found" };
      if (!isAgentDirect(p.agency)) return { error: "agency_not_agent_direct" };
      const ag = agencyById(p.agency);
      if (!ag) return { error: "agency_not_found" };
      const pax = Math.max(1, num(args, "pax") || 2);
      const idx = args.departure_index === undefined || args.departure_index === "" ? -1 : num(args, "departure_index");
      const dep = (idx >= 0 ? p.departures[idx] : undefined) || p.departures.find((d) => d.seats >= pax && d.status !== "sold") || p.departures[0];
      if (!dep || dep.seats < pax || dep.status === "sold") return { error: "sold_out" };
      dep.seats -= pax;
      const hold_id = `HOLD-${Date.now().toString(36).toUpperCase()}`;
      const rec: TapHold = {
        hold_id,
        package_id: p.id,
        departure_index: p.departures.indexOf(dep),
        pax,
        expires: "15 minutes",
        total: p.real * pax,
        status: "held",
      };
      holds().set(hold_id, rec);
      return { ...rec, title: loc(p.title, lang), agency: loc(ag.name, lang), departure: loc(dep.date, lang), next: "book" };
    }
    case "book":
      return confirmHold(args, str(args, "method") || "PromptPay");
    case "pay":
      return confirmHold(args, str(args, "method") || "PromptPay");
    case "cancel": {
      const b = books().get(str(args, "booking_id"));
      if (!b) return { error: "booking_not_found" };
      b.status = "cancelled";
      const p = pkgById(b.package_id);
      if (p) {
        const dep = p.departures[0];
        if (dep) dep.seats += b.pax;
      }
      return { ...b, inventory_restored: true };
    }
    case "modify": {
      const b = books().get(str(args, "booking_id"));
      if (!b || b.status === "cancelled") return { error: "booking_not_found" };
      const pax = Math.max(1, num(args, "pax"));
      const p = pkgById(b.package_id);
      if (!p) return { error: "package_not_found" };
      b.pax = pax;
      b.total = p.real * pax;
      b.deposit = 5000 * pax;
      b.status = "modified";
      return { ...b };
    }
    case "status": {
      const hold = str(args, "hold_id") ? holds().get(str(args, "hold_id")) : undefined;
      const book = str(args, "booking_id") ? books().get(str(args, "booking_id")) : undefined;
      if (!hold && !book) return { error: "not_found" };
      return { hold, booking: book };
    }
    case "demand": {
      const dest = str(args, "destination").toLowerCase();
      const rows = dest ? DEMAND.filter((d) => d.destination.toLowerCase() === dest) : DEMAND;
      return { source: "TOUR24 Agent Gateway search log", rows };
    }
    case "review": {
      const pid = str(args, "package_id");
      const p = pid ? pkgById(pid) : undefined;
      return {
        package_id: pid || null,
        reviews: DATA.reviews.slice(0, 5).map((r) => ({
          score: r.score,
          text: loc(r.text, lang),
          name: loc(r.name, lang),
          trip: loc(r.trip, lang),
          package: p ? loc(p.title, lang) : null,
        })),
      };
    }
    case "get_agency_identity":
      return buildTour24Json(str(args, "agency_id") || "siam", origin);
    default:
      return { error: "unknown_tool", tools: TAP_TOOLS.map((t) => t.name) };
  }
}

function schemaType(v: string) {
  const optional = v.endsWith("?");
  const raw = optional ? v.slice(0, -1) : v;
  if (raw.endsWith("[]")) return { type: "array", items: { type: raw.slice(0, -2) === "number" ? "number" : "string" } };
  return { type: raw };
}

export function tapMcpManifest(origin: string) {
  return {
    name: "tour24-agent-direct",
    version: TAP_VERSION,
    description: "TOUR24 Agent Gateway — search, compare, hold and book verified package tours. The agency owns the traveler.",
    tools: TAP_TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: { type: "object", properties: Object.fromEntries(Object.entries(t.input).map(([k, v]) => [k, schemaType(v)])) },
    })),
    invoke: `${origin}/api/agent/invoke`,
  };
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function originOf(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3001";
  const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
