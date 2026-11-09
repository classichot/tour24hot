import type { Role, Session } from "./session";

/**
 * Demo members, one or more per role. The password is shown on the sign-in page on purpose:
 * this is a prototype login, not a security boundary. Replace with a real user store.
 */
export const DEMO_PASSWORD = "tour24demo";

export interface DemoAccount extends Session {
  note: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "out-buyer", id: "cus-thanakrit", name: "Thanakrit P.", email: "thanakrit@tour24.demo", note: "Tokyo · Fuji, Oct 2026" },
  { role: "in-buyer", id: "cus-chenjia", name: "Chen Jia 陈佳", email: "chenjia@tour24.demo", note: "Chiang Mai · Golden Triangle, Oct 2026" },
  { role: "out-seller", id: "ag-siam-out", name: "Kittima S.", email: "kittima@siamhorizon.demo", org: "Siam Horizon Tours", note: "Outbound desk" },
  { role: "in-seller", id: "ag-siam-in", name: "Wichai R.", email: "wichai@siamhorizon.demo", org: "Siam Horizon Tours · Inbound DMC", note: "Inbound desk" },
  { role: "os", id: "m-lead", name: "Ploy", email: "ploy@tour24.demo", org: "TOUR24 inbound desk", note: "Desk lead" },
  { role: "os", id: "m-hotel", name: "Fon", email: "fon@tour24.demo", org: "TOUR24 inbound desk", note: "Ops — hotels" },
  { role: "os", id: "m-docs", name: "Mint", email: "mint@tour24.demo", org: "TOUR24 inbound desk", note: "Docs & TDAC" },
];

export const demoAccountsFor = (role: Role) => DEMO_ACCOUNTS.filter((a) => a.role === role);

export function checkDemoLogin(email: string, password: string): Session | null {
  const a = DEMO_ACCOUNTS.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!a || password !== DEMO_PASSWORD) return null;
  return { role: a.role, id: a.id, name: a.name, email: a.email, org: a.org };
}
