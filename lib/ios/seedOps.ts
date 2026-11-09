import type { DocumentType, IosState, Result, Traveller } from "./types";
import { addDays, allServices } from "./rules";
import { createIncident, createReservation, generateDocument, issueDocument, markReady, recordDelivery, recordHold, recordReply, requestReservation, saveGuests, setOpsOwner, startTrip, updateIncident } from "./ops";

/**
 * Operations sample (milestone C). Built by running the real domain actions, so the sample carries the same
 * evidence, versions and audit trail a person would create — nothing is pasted in as finished state.
 */

let n = 0;
const gid = () => `g-${(++n).toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const at = (date: string, time = "09:00") => `${date}T${time}:00.000+07:00`;

const CN_FAMILY = ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao", "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "Hu", "Guo", "He"];
const CN_GIVEN = ["Wei", "Fang", "Na", "Min", "Jing", "Lei", "Yan", "Tao", "Hui", "Qiang", "Ying", "Jun", "Xia", "Bo", "Lan", "Hong", "Ping"];
const KR = ["Park Min-jun", "Kim Seo-yeon", "Lee Ji-hoon", "Choi Hyun-woo", "Jung Da-eun", "Kang Tae-yang", "Yoon Ji-ho", "Han So-young", "Lim Jae-won", "Shin Eun-ji", "Oh Sung-min", "Seo Yu-na"];

export function addSampleOperations(input: IosState, today: string): IosState {
  let s = input;
  const ops = s.members.find((m) => m.role === "ops") ?? s.members.find((m) => m.role === "manager");
  const lead = s.members.find((m) => m.role === "manager") ?? ops;
  const docs = s.members.find((m) => m.id === "m-docs") ?? ops;
  if (!ops || !lead || !docs) return s;

  const step = <T,>(res: Result<T>): T | undefined => {
    if (res.ok) {
      s = res.state;
      return res.value;
    }
    return undefined;
  };
  const tripId = (name: string) => s.trips.find((t) => t.sample && t.name === name)?.id;
  const trip = (id: string) => s.trips.find((t) => t.id === id)!;
  const svc = (id: string, category: string, nth = 0) => allServices(trip(id)).filter((x) => x.s.category === category)[nth]?.s;
  const resOf = (id: string, rid: string) => trip(id).reservations.find((r) => r.id === rid)!;

  /** Draft → request → supplier reply, with the supplier's own words as evidence. */
  const reserve = (id: string, serviceId: string, stage: "draft" | "requested" | "held" | "confirmed", when: { request: string; reply?: string }, reply?: { confirmer: string; ref: string; evidence: string; holdExpiry?: string }) => {
    const sv = allServices(trip(id)).find((x) => x.s.id === serviceId)!.s;
    const created = step(createReservation(s, ops, id, serviceId, { supplierId: sv.supplierId!, qty: sv.qty, amount: (sv.unitCost ?? 0) * sv.qty, currency: sv.costCurrency }, when.request));
    if (!created || stage === "draft") return;
    step(requestReservation(s, ops, id, created.id, `Email to ${s.companies.find((c) => c.id === sv.supplierId)?.name}: “Request: ${sv.qty} × ${sv.name}, ${trip(id).ref}”`, when.request));
    if (stage === "requested" || !reply || !when.reply) return;
    if (stage === "held") {
      step(recordHold(s, ops, id, created.id, { holdExpiry: reply.holdExpiry!, ref: reply.ref, evidence: reply.evidence }, when.reply));
      return;
    }
    const r = resOf(id, created.id);
    step(recordReply(s, ops, id, r.id, r.version, { confirmer: reply.confirmer, ref: reply.ref, evidence: reply.evidence, qty: r.qty, startDate: r.startDate, endDate: r.endDate, amount: r.amount, requestVersion: r.requestVersion }, when.reply));
  };

  const issue = (id: string, types: DocumentType[], when: string) => {
    for (const type of types) {
      const d = step(generateDocument(s, docs, id, type, undefined, when));
      if (d) step(issueDocument(s, docs, id, d.id, when));
    }
  };

  /* Golden Triangle 40: part-confirmed, one hold about to lapse, one request unanswered, guest list incomplete. */
  const gt = tripId("Golden Triangle 40, no shopping");
  if (gt) {
    const t0 = trip(gt).startDate!;
    step(setOpsOwner(s, lead, gt, ops.id, at(addDays(today, -32))));
    const [cnx, cei] = [svc(gt, "hotel", 0), svc(gt, "hotel", 1)];
    const bus = svc(gt, "transport");
    const gd = svc(gt, "guide");
    const lunch = svc(gt, "meal");
    if (cnx)
      reserve(gt, cnx.id, "confirmed", { request: at(addDays(today, -32), "10:00"), reply: at(addDays(today, -30), "14:20") }, {
        confirmer: "Khun Dao, reservations",
        ref: "LMC-88213",
        evidence: `Dear Fon, we are pleased to confirm 21 Deluxe twin rooms with breakfast, check-in ${t0}, 2 nights, group NF-2026-114. Confirmation LMC-88213.`,
      });
    if (gd)
      reserve(gt, gd.id, "confirmed", { request: at(addDays(today, -31)), reply: at(addDays(today, -31), "16:05") }, {
        confirmer: "Ming",
        ref: "MING-0612",
        evidence: "LINE from Ming: OK confirmed, I take this group 6 days, Chinese language, 08:00–18:00. Ref MING-0612.",
      });
    if (cei)
      reserve(gt, cei.id, "held", { request: at(addDays(today, -3)), reply: at(addDays(today, -1), "11:30") }, {
        confirmer: "Front office",
        ref: "LMR-H-4471",
        evidence: "We can hold 21 river view rooms on a provisional basis until tomorrow 10:00 local time. Please confirm before then.",
        holdExpiry: `${addDays(today, 1)}T10:00:00+07:00`,
      });
    if (bus) reserve(gt, bus.id, "requested", { request: at(addDays(today, -2), "15:40") });
    if (lunch) reserve(gt, lunch.id, "draft", { request: at(addDays(today, -1), "10:15") });
    const guests: Traveller[] = Array.from({ length: 34 }, (_, i) => ({
      id: gid(),
      name: `${CN_FAMILY[i % CN_FAMILY.length]} ${CN_GIVEN[(i * 7) % CN_GIVEN.length]}`,
      category: "adult",
      language: "Chinese",
      arrival: "CZ3051 CAN–CNX 07:10",
      room: `T${String(Math.floor(i / 2) + 1).padStart(2, "0")}`,
      roomType: "twin",
      pickupGroup: "CZ3051",
      serviceNotes: i === 3 ? "Vegetarian" : i === 8 ? "No pork" : undefined,
      restricted: { nationality: "China", passportNo: `E${String(48211730 + i * 37)}`, dob: `${1962 + (i % 30)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}` },
    }));
    step(saveGuests(s, ops, gt, trip(gt).guestsVersion, guests, at(addDays(today, -5), "17:00")));
  }

  /* Chiang Mai golf 12: everything confirmed and issued, marked ready, arriving today. */
  const golf = tripId("Chiang Mai golf 12");
  if (golf) {
    step(setOpsOwner(s, lead, golf, ops.id, at(addDays(today, -24))));
    const van = svc(golf, "transport");
    if (van)
      reserve(golf, van.id, "confirmed", { request: at(addDays(today, -20)), reply: at(addDays(today, -19), "10:40") }, {
        confirmer: "Krit, Lanna Connect",
        ref: "LC-5521",
        evidence: `Confirmed 2 vans, CNX arrivals ${today} 14:20, KE661, 12 guests with 12 golf bags. Drivers Somchai 081 000 4411, Anan 081 000 4412. Ref LC-5521.`,
      });
    const guests: Traveller[] = KR.map((name, i) => ({ id: gid(), name, category: "adult", language: "Korean", pickupGroup: i < 6 ? "Van 1" : "Van 2", serviceNotes: i === 4 ? "Shellfish allergy" : undefined, restricted: { nationality: "South Korea" } }));
    step(saveGuests(s, ops, golf, trip(golf).guestsVersion, guests, at(addDays(today, -6), "11:00")));
    issue(golf, ["itinerary", "pickup", "runsheet"], at(addDays(today, -3), "15:00"));
    const itin = trip(golf).documents.find((d) => d.type === "itinerary" && d.status === "issued");
    if (itin) step(recordDelivery(s, docs, golf, itin.id, "Park Min-jun <park@seoulgolf.example>", "email", at(addDays(today, -3), "15:10")));
    step(markReady(s, ops, golf, at(addDays(today, -2), "16:00")));
  }

  /* Chiang Mai family 6: started yesterday, one open incident today. */
  const fam = tripId("Chiang Mai family discovery 6");
  if (fam) {
    step(setOpsOwner(s, lead, fam, ops.id, at(addDays(today, -17))));
    const van = svc(fam, "transport");
    const gd = svc(fam, "guide");
    if (van)
      reserve(fam, van.id, "confirmed", { request: at(addDays(today, -16)), reply: at(addDays(today, -15), "09:30") }, {
        confirmer: "Krit, Lanna Connect",
        ref: "LC-5590",
        evidence: "Confirmed: 10-seat van with driver for 3 days, pickup Rachamankha Hotel lobby 08:30 daily. Driver Boon 081 000 7781. Ref LC-5590.",
      });
    if (gd)
      reserve(fam, gd.id, "confirmed", { request: at(addDays(today, -16), "09:20"), reply: at(addDays(today, -16), "13:15") }, {
        confirmer: "Ming",
        ref: "MING-0698",
        evidence: "LINE from Ming: confirmed for the Clarke family 3 days, English guiding, 08:30–17:30. Ref MING-0698.",
      });
    const names = ["Emma Clarke", "James Clarke", "Olivia Clarke", "Noah Clarke", "Margaret Hughes", "Peter Hughes"];
    const guests: Traveller[] = names.map((name, i) => ({ id: gid(), name, category: i === 2 || i === 3 ? "child" : "adult", language: "English", pickupGroup: "Hotel lobby", serviceNotes: i === 4 ? "Walks slowly; avoid long stairs" : undefined }));
    step(saveGuests(s, ops, fam, trip(fam).guestsVersion, guests, at(addDays(today, -10))));
    issue(fam, ["itinerary", "pickup", "runsheet"], at(addDays(today, -4), "14:00"));
    step(markReady(s, ops, fam, at(addDays(today, -3), "10:00")));
    step(startTrip(s, ops, fam, at(addDays(today, -1), "08:30")));
    const incWhen = at(today, "09:10");
    step(
      createIncident(s, ops, fam, { title: "Van air-conditioning failed on the way to Mae Rim", category: "transport", severity: "high", serviceId: van?.id, ownerId: ops.id, description: "Driver Boon called at 09:05: air-conditioning stopped, guests uncomfortable. Stopped at PTT station Mae Rim.", evidence: "Call from driver 09:05" }, incWhen)
    );
    const inc = trip(fam).incidents[0];
    if (inc) step(updateIncident(s, ops, fam, inc.id, { status: "in_progress", action: "Krit (Lanna Connect) dispatching a replacement van, ETA 40 minutes. Guide moved guests to the café." }, at(today, "09:20")));
  }

  return s;
}
