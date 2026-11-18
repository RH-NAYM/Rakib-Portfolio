"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

/**
 * Phase 4: what visitors ask and where the twin falls short. All auth and data live in the
 * twin service (/api/twin/admin/*): this page is only UI (single enforcement point, eng R2-3).
 */
type Insights = {
  ok: true;
  days: number;
  conversations: number;
  languages: Record<string, number>;
  top_questions: [string, number][];
  unanswered: { q: string; at?: number }[];
  latency_ms: { p50: number; p95: number };
  spend: { day: string; usd: number }[];
  logging: boolean;
};

export function InsightsDashboard() {
  const [data, setData] = useState<Insights | null>(null);
  const [state, setState] = useState<"loading" | "login" | "ready" | "error">("loading");
  const [msg, setMsg] = useState("");
  const [days, setDays] = useState(7);

  const load = useCallback(async (d: number) => {
    const r = await fetch(`/api/twin/admin/insights?days=${d}`, { cache: "no-store" });
    if (r.status === 401) return setState("login");
    if (!r.ok) return setState("error");
    setData(await r.json());
    setState("ready");
  }, []);

  useEffect(() => {
    void load(days);
  }, [load, days]);

  const login = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const password = new FormData(e.currentTarget).get("password");
    const r = await fetch("/api/twin/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
    if (r.ok) {
      setMsg("");
      return load(days);
    }
    setMsg(r.status === 429 ? "Too many attempts. Wait 15 minutes." : r.status === 404 ? "Admin isn't configured (set ADMIN_PASSWORD_HASH and TWIN_ADMIN_SECRET)." : "Wrong password.");
  };

  const logout = async () => {
    await fetch("/api/twin/admin/logout", { method: "POST" });
    setData(null);
    setState("login");
  };

  if (state === "loading") return <p className="text-[--color-text-muted]">Loading…</p>;
  if (state === "error") return <p className="text-[--color-text]">Couldn&apos;t load insights. Is the twin service deployed?</p>;
  if (state === "login" || !data)
    return (
      <form onSubmit={login} className="mx-auto max-w-sm space-y-3">
        <h1 className="text-2xl font-semibold text-[--color-text]">Twin insights</h1>
        <label htmlFor="admin-password" className="block text-sm text-[--color-text-muted]">Password</label>
        <input id="admin-password" name="password" type="password" required autoComplete="current-password" className="min-h-11 w-full rounded-[--radius] border border-[--color-border] bg-[--color-bg] px-3 text-[--color-text]" />
        {msg && <p role="alert" className="text-sm text-[--color-text]">{msg}</p>}
        <button type="submit" className="min-h-11 w-full rounded-[--radius] bg-[--color-accent] font-semibold text-[--color-bg]">Sign in</button>
      </form>
    );

  const totalUsd = data.spend.reduce((s, d) => s + d.usd, 0);
  const maxUsd = Math.max(...data.spend.map((d) => d.usd), 0.0001);
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[--color-text]">Twin insights</h1>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="days" className="text-[--color-text-muted]">Range</label>
          <select id="days" value={days} onChange={(e) => setDays(Number(e.target.value))} className="min-h-11 rounded-[--radius] border border-[--color-border] bg-[--color-bg] px-2 text-[--color-text]">
            {[1, 7, 30, 90].map((d) => <option key={d} value={d}>Last {d} day{d > 1 ? "s" : ""}</option>)}
          </select>
          <button type="button" onClick={() => void logout()} className="min-h-11 rounded-[--radius] border border-[--color-border-strong] px-3 text-[--color-text-muted]">Sign out</button>
        </div>
      </div>
      {!data.logging && <p className="rounded-[--radius] border border-[--color-border-strong] p-3 text-sm text-[--color-text]">Conversation logging is off. Set TWIN_LOG_CONVERSATIONS=true and NEXT_PUBLIC_TWIN_LOGGING=true to collect questions (90-day retention, disclosed in the chat).</p>}

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[--radius] border border-[--color-border] bg-[--color-border] sm:grid-cols-4">
        {[
          ["Conversations", String(data.conversations)],
          ["Unanswered", String(data.unanswered.length)],
          ["Latency p50 / p95", `${(data.latency_ms.p50 / 1000).toFixed(1)}s / ${(data.latency_ms.p95 / 1000).toFixed(1)}s`],
          ["Spend", `$${totalUsd.toFixed(3)}`],
        ].map(([k, v]) => (
          <div key={k} className="bg-[--color-bg-elevated] p-4">
            <dt className="text-xs text-[--color-text-muted]">{k}</dt>
            <dd className="mt-1 text-xl font-semibold tabular-nums text-[--color-text]">{v}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-[--color-text]">Knowledge gaps</h2>
        <p className="mb-3 text-sm text-[--color-text-muted]">Questions the twin couldn&apos;t ground. Add answers to content/twin/notes.md, then run npm run twin:corpus.</p>
        {data.unanswered.length === 0 ? <p className="text-sm text-[--color-text-muted]">None in this range.</p> : (
          <ul className="divide-y divide-[--color-border] rounded-[--radius] border border-[--color-border]">
            {data.unanswered.map((u, i) => <li key={i} className="p-3 text-sm text-[--color-text]">{u.q}</li>)}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold text-[--color-text]">Top questions</h2>
        <ol className="divide-y divide-[--color-border] rounded-[--radius] border border-[--color-border]">
          {data.top_questions.map(([q, n]) => (
            <li key={q} className="flex justify-between gap-3 p-3 text-sm"><span className="text-[--color-text]">{q}</span><span className="tabular-nums text-[--color-text-muted]">{n}</span></li>
          ))}
        </ol>
      </section>

      <div className="grid gap-8 sm:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[--color-text]">Languages</h2>
          <ul className="space-y-1 text-sm">
            {Object.entries(data.languages).map(([l, n]) => (
              <li key={l} className="flex justify-between"><span className="text-[--color-text]">{({ en: "English", bn: "বাংলা", banglish: "Banglish" } as Record<string, string>)[l] ?? l}</span><span className="tabular-nums text-[--color-text-muted]">{n}</span></li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[--color-text]">Daily spend (Asia/Dhaka)</h2>
          <ul className="space-y-1">
            {data.spend.map((d) => (
              <li key={d.day} className="grid grid-cols-[6rem_1fr_4rem] items-center gap-2 text-xs">
                <span className="tabular-nums text-[--color-text-muted]">{d.day}</span>
                <span className="h-2 rounded-sm bg-[--color-accent]" style={{ width: `${(d.usd / maxUsd) * 100}%` }} aria-hidden />
                <span className="text-right tabular-nums text-[--color-text]">${d.usd.toFixed(3)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
