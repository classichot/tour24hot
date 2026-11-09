"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useIos } from "@/lib/ios/store";
import { can, ROLE_LABEL } from "@/lib/ios/rules";
import { signOut, useMember } from "@/lib/auth/client";
import Search from "./Search";
import Setup from "./Setup";
import { btn } from "./ui";

/** Five primary menus (D01). Money appears in milestone D; unfinished menus are not shown (ARC05). */
const MENUS = [
  { key: "today", label: "Today", href: "/os", match: (p: string) => p === "/os" },
  { key: "sales", label: "Sales", href: "/os/sales", match: (p: string) => p.startsWith("/os/sales") },
  { key: "trips", label: "Trips", href: "/os/trips", match: (p: string) => p.startsWith("/os/trips") },
  { key: "partners", label: "Partners", href: "/os/partners", match: (p: string) => p.startsWith("/os/partners") },
];

function fmtCompanyDate(tz: string) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "numeric", month: "short", year: "numeric" }).format(new Date());
}

export default function IosShell({ children }: { children: React.ReactNode }) {
  const { state, hydrated, me, online } = useIos();
  const session = useMember();
  const path = usePathname() || "/os";
  const router = useRouter();

  // Printable customer documents render without chrome.
  if (path.includes("/print/")) return <div className="min-h-screen bg-white text-[#201e1d]">{hydrated ? children : null}</div>;

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f6f5] text-[16px] text-[#5b5754]" role="status">
        Loading your workspace…
      </div>
    );
  }

  if (!state.settings.setupDone) return <div className="min-h-screen bg-[#f7f6f5] text-[#201e1d]"><Setup /></div>;

  if (!me) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f6f5] px-5 text-[#201e1d]">
        <div className="max-w-[520px] rounded-[8px] border border-[#dcd9d6] bg-white p-8 text-[16px]">
          <h1 className="text-[24px] font-extrabold">You are not a staff member here</h1>
          <p className="mt-2 text-[#5b5754]">
            {session ? `${session.email} is signed in, but ${state.settings.companyName} has no staff member with this email.` : "Sign in with a staff account."} Ask an owner or manager to add you in Company.
          </p>
          <div className="mt-5 flex gap-2">
            <button type="button" className={btn.primary} onClick={async () => { await signOut(); router.push("/login?role=os"); }}>
              Sign in as someone else
            </button>
            <Link href="/" className={btn.secondary}>
              Back to TOUR24
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canCreate = can(me, "enquiry.create");

  return (
    <div className="min-h-screen bg-[#f7f6f5] text-[16px] leading-[1.5] text-[#201e1d] lg:grid lg:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="hidden border-r border-[#e1deda] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="border-b border-[#ebe8e5] px-5 py-5">
          <Link href="/os" className="font-[family-name:var(--font-heading)] text-[24px] font-extrabold leading-none tracking-[-0.02em] text-[#201e1d] no-underline">
            TOUR<span className="text-[#f2b01e]">24</span>
          </Link>
          <div className="mt-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[#875e00]">Inbound OS</div>
          <div className="mt-1 truncate text-[14px] text-[#5b5754]" title={state.settings.companyName}>
            {state.settings.companyName}
          </div>
        </div>
        {canCreate && (
          <div className="px-4 pt-4">
            <Link href="/os/sales/new" className={`${btn.primary} w-full`}>
              New enquiry
            </Link>
          </div>
        )}
        <nav aria-label="Main" className="flex flex-col gap-0.5 px-3 py-4">
          {MENUS.map((m) => {
            const on = m.match(path);
            return (
              <Link key={m.key} href={m.href} aria-current={on ? "page" : undefined} className={`rounded-[4px] border-l-[3px] px-3 py-2 text-[16px] font-semibold no-underline ${on ? "border-[#f2b01e] bg-[#fff6e0] text-[#201e1d]" : "border-transparent text-[#3b3836] hover:bg-[#f3f2f1]"}`}>
                {m.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-1 border-t border-[#ebe8e5] px-3 py-4 text-[15px]">
          <Link href="/os/company" aria-current={path.startsWith("/os/company") ? "page" : undefined} className={`rounded-[4px] px-3 py-2 font-semibold no-underline ${path.startsWith("/os/company") ? "bg-[#fff6e0] text-[#201e1d]" : "text-[#3b3836] hover:bg-[#f3f2f1]"}`}>
            Company
          </Link>
          <Link href="/os-legacy" className="rounded-[4px] px-3 py-2 text-[14px] text-[#5b5754] no-underline hover:bg-[#f3f2f1]">
            Legacy OS (read only reference)
          </Link>
          <div className="mt-2 flex items-center gap-2.5 rounded-[6px] bg-[#f7f6f5] px-3 py-2.5">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#201e1d] text-[14px] font-bold text-white">{me.name.slice(0, 1)}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-bold">{me.name}</div>
              <div className="truncate text-[13px] text-[#5b5754]">{ROLE_LABEL[me.role]}</div>
            </div>
          </div>
          <button type="button" className={`${btn.ghost} justify-center`} onClick={async () => { await signOut(); router.push("/login?role=os"); router.refresh(); }}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col pb-20 lg:pb-0">
        <header className="sticky top-0 z-40 flex flex-wrap items-center gap-3 border-b border-[#e1deda] bg-white/95 px-4 py-3 backdrop-blur lg:px-8">
          <Link href="/os" className="font-[family-name:var(--font-heading)] text-[20px] font-extrabold text-[#201e1d] no-underline lg:hidden">
            TOUR<span className="text-[#f2b01e]">24</span>
          </Link>
          <div className="order-last w-full sm:order-none sm:w-auto sm:flex-1">
            <Search />
          </div>
          <div className="ml-auto flex items-center gap-3 text-[14px] text-[#5b5754]">
            {!online && (
              <span role="status" className="rounded-[4px] border border-[#f2d48a] bg-[#fff6e0] px-2 py-0.5 font-semibold text-[#714e04]">
                Offline — changes are kept on this device
              </span>
            )}
            <span>
              {fmtCompanyDate(state.settings.timezone)} · {state.settings.timezone}
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">{children}</main>
      </div>

      {/* Mobile bottom navigation (NAV01) */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-[#e1deda] bg-white lg:hidden">
        {MENUS.map((m) => {
          const on = m.match(path);
          return (
            <Link key={m.key} href={m.href} aria-current={on ? "page" : undefined} className={`flex flex-col items-center px-1 py-2.5 text-[13px] font-semibold no-underline ${on ? "text-[#201e1d]" : "text-[#6b6764]"}`}>
              <span className={`mb-1 h-1 w-8 rounded-full ${on ? "bg-[#f2b01e]" : "bg-transparent"}`} aria-hidden />
              {m.label}
            </Link>
          );
        })}
        {canCreate ? (
          <Link href="/os/sales/new" className="m-1.5 flex items-center justify-center rounded-[4px] bg-[#f2b01e] text-[13px] font-bold text-[#201e1d] no-underline">
            New enquiry
          </Link>
        ) : (
          <Link href="/os/company" className="flex flex-col items-center justify-center text-[13px] font-semibold text-[#6b6764] no-underline">
            Company
          </Link>
        )}
      </nav>
    </div>
  );
}
