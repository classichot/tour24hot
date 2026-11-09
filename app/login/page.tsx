"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { ROLES, ROLE_INFO, type Role } from "@/lib/auth/session";
import { DEMO_PASSWORD, demoAccountsFor } from "@/lib/auth/demo-accounts";
import { signIn, signOut, useMember } from "@/lib/auth/client";
import { AU } from "@/components/auth/copy";

const GROUPS: { key: "buy" | "sell" | "run"; label: typeof AU.groupBuy }[] = [
  { key: "buy", label: AU.groupBuy },
  { key: "sell", label: AU.groupSell },
  { key: "run", label: AU.groupRun },
];

function safeNext(raw: string | null) {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/login") ? raw : null;
}

export default function LoginPage() {
  const { L } = useApp();
  const router = useRouter();
  const params = useSearchParams();
  const member = useMember();
  const asked = params.get("role") as Role | null;
  const wrong = params.get("wrong") as Role | null;
  const next = safeNext(params.get("next"));
  const [role, setRole] = useState<Role>(asked && ROLES.includes(asked) ? asked : "out-buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ kind: "bad" | "role"; role?: Role } | null>(null);
  const info = ROLE_INFO[role];
  const demos = demoAccountsFor(role);

  async function submit(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    const c = creds ?? { email, password };
    setBusy(true);
    setError(null);
    const res = await signIn(c.email, c.password, role);
    setBusy(false);
    if (!res.ok) {
      setError({ kind: res.error, role: res.role });
      return;
    }
    // A `next` path only makes sense if this role can open it; otherwise go to the role's home.
    router.push(next && asked === role ? next : res.home);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-[1240px] px-5 pb-24 pt-10 lg:px-10">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section>
          <div className="kicker">{L(AU.kicker)}</div>
          <h1 className="mt-1.5 text-[clamp(30px,3.4vw,46px)]">{L(AU.title)}</h1>
          <p className="mt-2 max-w-[620px] text-[15px] text-neutral-800">{L(AU.sub)}</p>

          {wrong && member && (
            <div role="status" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-2 border-accent-700 bg-accent-100 px-4 py-3 text-[14px] text-accent-800">
              <span>
                {L(AU.wrongSpace)} — {L(AU.signedInAs)} <strong>{member.name}</strong> ({L(ROLE_INFO[member.role].title)})
              </span>
              <button type="button" className="btn btn-secondary bg-bg" onClick={() => signOut()}>
                {L(AU.signOut)}
              </button>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-7" role="radiogroup" aria-label={L(AU.kicker)}>
            {GROUPS.map((g) => (
              <div key={g.key}>
                <div className="microlabel mb-2">{L(g.label)}</div>
                <div className="grid gap-3 md:grid-cols-2">
                  {ROLES.filter((r) => ROLE_INFO[r].group === g.key).map((r) => {
                    const on = r === role;
                    return (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => {
                          setRole(r);
                          setError(null);
                        }}
                        className={`cursor-pointer border-2 px-5 py-4 text-left transition-colors ${on ? "border-text bg-accent-100" : "border-divider bg-bg hover:border-text"}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-[family-name:var(--font-heading)] text-[17px] font-extrabold">{L(ROLE_INFO[r].title)}</span>
                          <span className={`h-4 w-4 shrink-0 rounded-full border-2 ${on ? "border-accent-700 bg-accent" : "border-divider"}`} aria-hidden />
                        </div>
                        <p className="mt-1.5 text-[13px] text-neutral-800">{L(ROLE_INFO[r].sub)}</p>
                        <div className="mt-2 font-mono text-[11px] text-neutral-600">
                          {L(AU.opens)} {ROLE_INFO[r].home}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="lg:sticky lg:top-[112px]">
          {member && !wrong ? (
            <div className="border-2 border-text bg-bg p-6">
              <div className="microlabel">{L(AU.signedInAs)}</div>
              <div className="mt-1 text-[22px] font-extrabold">{member.name}</div>
              <div className="text-[14px] text-neutral-700">
                {L(ROLE_INFO[member.role].title)}
                {member.org ? ` · ${member.org}` : ""}
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href={ROLE_INFO[member.role].home} className="btn btn-primary no-underline">
                  {L(AU.goSpace)}
                </Link>
                <button type="button" className="btn btn-secondary" onClick={() => signOut()}>
                  {L(AU.signOut)}
                </button>
              </div>
            </div>
          ) : (
            <form className="flex flex-col gap-4 border-2 border-text bg-bg p-6" onSubmit={submit}>
              <div>
                <div className="microlabel">{L(AU.signIn)}</div>
                <h2 className="mt-1 text-[22px]">{L(info.title)}</h2>
              </div>
              <div className="field">
                <label htmlFor="li-email">{L(AU.email)}</label>
                <input id="li-email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="field">
                <label htmlFor="li-pass">{L(AU.password)}</label>
                <input id="li-pass" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && (
                <p role="alert" className="border-l-4 border-accent-700 bg-accent-100 px-3 py-2 text-[13px] text-accent-800">
                  {error.kind === "role" && error.role ? (
                    <>
                      {L(AU.wrongRoleTail)} <strong>{L(ROLE_INFO[error.role].title)}</strong>. {L(AU.pickThatRole)}
                    </>
                  ) : (
                    L(AU.bad)
                  )}
                </p>
              )}
              <button type="submit" className="btn btn-primary w-full" disabled={busy}>
                {busy ? L(AU.signingIn) : L(AU.signIn)}
              </button>

              <div className="border-t border-divider pt-4">
                <div className="microlabel">{L(AU.demo)}</div>
                <ul className="m-0 mt-2 flex list-none flex-col gap-2 p-0">
                  {demos.map((a) => (
                    <li key={a.email}>
                      <button
                        type="button"
                        disabled={busy}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 border border-divider bg-bg px-3 py-2 text-left hover:border-text"
                        onClick={() => {
                          setEmail(a.email);
                          setPassword(DEMO_PASSWORD);
                          submit(undefined, { email: a.email, password: DEMO_PASSWORD });
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[14px] font-extrabold">{a.name}</span>
                          <span className="block truncate text-[12px] text-neutral-700">
                            {a.email} · {a.note}
                          </span>
                        </span>
                        <span className="shrink-0 text-[12px] font-extrabold text-accent-700">{L(AU.useAccount)} →</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[12px] text-neutral-700">
                  {L(AU.demoNote)} <code className="font-mono font-semibold">{DEMO_PASSWORD}</code>
                </p>
              </div>
            </form>
          )}
        </aside>
      </div>
    </main>
  );
}
