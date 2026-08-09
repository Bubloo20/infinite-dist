"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { GlassCard, PortalMark } from "./PortalShell";
import type { WorkLog } from "@/lib/portal/db";

const fmt = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

function StatusPill({ status }: { status: string | null }) {
  const map: Record<string, string> = {
    valid: "border-emerald-400/30 bg-emerald-500/12 text-emerald-300",
    private: "border-amber-400/30 bg-amber-500/12 text-amber-300",
    unverified: "border-white/15 bg-white/[0.06] text-white/55",
  };
  const label: Record<string, string> = { valid: "Verified", private: "Private", unverified: "Unchecked" };
  const key = status || "unverified";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${map[key] || map.unverified}`}>
      {label[key] || key}
    </span>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <GlassCard className="p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p
        className={`mt-3 font-display text-4xl font-extrabold tracking-tight ${
          accent ? "bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent" : "text-white"
        }`}
      >
        {value}
      </p>
    </GlassCard>
  );
}

export default function AdminDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [dbOn, setDbOn] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/portal/logs")
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setDbOn(Boolean(d.dbConfigured));
        if (d.error) setErr(d.error);
      })
      .catch(() => setErr("Couldn't load work logs."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter((l) =>
      [l.worker_name, l.job_number, l.notes || ""].join(" ").toLowerCase().includes(term),
    );
  }, [logs, q]);

  const workers = useMemo(() => new Set(logs.map((l) => l.worker_name.toLowerCase())).size, [logs]);
  const verified = useMemo(() => logs.filter((l) => l.strava_status === "valid").length, [logs]);

  const exportCsv = () => {
    const head = ["Worker", "Job", "Started", "Finished", "Time spent", "Strava", "Strava check", "Map My Activity", "Notes", "Submitted"];
    const rows = filtered.map((l) =>
      [l.worker_name, l.job_number, l.started_at, l.ended_at, l.time_spent || "", l.strava_url, l.strava_status || "", l.mapmy_url || "", (l.notes || "").replace(/\n/g, " "), l.created_at]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[head.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `infinite-work-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-14 sm:py-20">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <PortalMark small />
        <div className="flex items-center gap-3">
          <Link href="/portal" className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white">
            Log a shift
          </Link>
          <button onClick={onSignOut} className="text-sm font-semibold text-white/40 transition hover:text-white/80">
            Sign out
          </button>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Admin</p>
        <h1 className="mt-4 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-extrabold leading-[1.05] tracking-tight text-white">
          Work <span className="bg-gradient-to-r from-[#8b93ff] to-orchid bg-clip-text text-transparent">dashboard</span>
        </h1>
      </motion.div>

      <div className="mt-9 grid gap-4 sm:grid-cols-3">
        <Stat label="Logged shifts" value={String(logs.length)} accent />
        <Stat label="Team members" value={String(workers)} />
        <Stat label="Strava verified" value={`${verified}/${logs.length}`} />
      </div>

      {!dbOn && (
        <GlassCard className="mt-6 border-amber-400/25 bg-amber-500/[0.07] p-6" delay={0.1}>
          <p className="font-display text-lg font-bold text-amber-200">Database not connected yet</p>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-100/70">
            Submissions are still emailed to you, but nothing is stored here until a Postgres store is attached. In Vercel:
            open your project → <span className="font-semibold">Storage</span> → <span className="font-semibold">Create Database</span> →{" "}
            <span className="font-semibold">Postgres</span>, connect it to this project, then redeploy. The table is created automatically.
          </p>
        </GlassCard>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
          </svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, job number or notes…"
            className="w-full rounded-2xl border border-white/12 bg-white/[0.05] py-3 pl-11 pr-4 text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08]"
          />
        </div>
        <button onClick={load} className="rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.09] hover:text-white">
          Refresh
        </button>
        <button
          onClick={exportCsv}
          disabled={!filtered.length}
          className="rounded-2xl bg-gradient-to-r from-electric to-orchid px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Export CSV
        </button>
      </div>

      {err && <p className="mt-5 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{err}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="grid place-items-center py-20">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" />
          </div>
        ) : !filtered.length ? (
          <GlassCard className="p-14 text-center">
            <p className="font-display text-xl font-bold text-white">No work logs yet</p>
            <p className="mt-2 text-white/50">Entries submitted through the portal will appear here.</p>
          </GlassCard>
        ) : (
          filtered.map((l, i) => (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: Math.min(i * 0.03, 0.3) }}
            >
              <GlassCard className="p-6 transition hover:border-white/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-display text-xl font-bold text-white">{l.worker_name}</h3>
                      <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-mono text-[12px] text-white/70">{l.job_number}</span>
                      <StatusPill status={l.strava_status} />
                    </div>
                    <p className="mt-2.5 text-sm text-white/50">
                      {fmt(l.started_at)} → {fmt(l.ended_at)}
                      {l.time_spent && <span className="ml-2 text-white/75">· {l.time_spent}</span>}
                    </p>
                    {l.notes && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-white/60">{l.notes}</p>}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <a
                      href={l.strava_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#fc4c02]/40 bg-[#fc4c02]/10 px-4 py-2 text-[13px] font-bold text-[#ff8b5e] transition hover:bg-[#fc4c02]/20"
                    >
                      Strava activity ↗
                    </a>
                    {l.mapmy_url && (
                      <a
                        href={l.mapmy_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2 text-[13px] font-bold text-white/70 transition hover:bg-white/[0.1]"
                      >
                        Map My Activity ↗
                      </a>
                    )}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
