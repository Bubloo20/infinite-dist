"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "./PortalShell";
import type { WorkLog, Payment } from "@/lib/portal/db";
import { unpackLinks } from "@/lib/portal/db";

const money = (v: number) => `$${v.toFixed(2)}`;
const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);
const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const stamp = (d: string) =>
  new Date(d).toLocaleString("en-AU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

type Totals = {
  owed: number; paid: number; jobCount: number;
  unpaidCount: number; paidCount: number; awaitingRate: number; leaflets: number;
};

function Stat({ label, value, tone }: { label: string; value: string; tone?: "owed" | "paid" }) {
  return (
    <GlassCard className="p-5 sm:p-6">
      <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-white/40">{label}</p>
      <p className={`mt-2.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
        tone === "owed" ? "text-amber-300" : tone === "paid" ? "text-emerald-300" : "text-white"}`}>
        {value}
      </p>
    </GlassCard>
  );
}

function JobCard({ job }: { job: WorkLog }) {
  const strava = unpackLinks(job.strava_urls);
  const mapmy = unpackLinks(job.mapmy_urls);
  const paid = Boolean(job.paid_on);
  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="rounded-lg bg-white/[0.08] px-2.5 py-1 font-mono text-[12px] text-white/75">{job.job_number}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              paid ? "border-emerald-400/30 bg-emerald-500/12 text-emerald-300" : "border-amber-400/30 bg-amber-500/12 text-amber-300"}`}>
              {paid ? `Paid ${day(job.paid_on)}` : "Awaiting payment"}
            </span>
          </div>
          <p className="mt-2.5 text-sm text-white/50">
            {stamp(job.started_at)} → {stamp(job.ended_at)}
            {job.time_spent && <span className="ml-2 text-white/75">· {job.time_spent}</span>}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {job.area_worked || "Area not recorded"}
            {job.leaflet_count ? ` · ${job.leaflet_count} leaflets` : ""}
          </p>
          {(strava.length > 0 || mapmy.length > 0) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {strava.map((u, i) => (
                <a key={u} href={u} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-[#fc4c02]/40 bg-[#fc4c02]/10 px-3 py-1.5 text-[12px] font-bold text-[#ff8b5e] transition hover:bg-[#fc4c02]/20">
                  Strava {strava.length > 1 ? i + 1 : ""} ↗
                </a>
              ))}
              {mapmy.map((u, i) => (
                <a key={u} href={u} target="_blank" rel="noreferrer"
                  className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-bold text-white/65 transition hover:bg-white/[0.1]">
                  Map My {mapmy.length > 1 ? i + 1 : ""} ↗
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className={`font-display text-2xl font-extrabold ${paid ? "text-emerald-300" : "text-white"}`}>
            {job.amount === null ? "—" : money(num(job.amount))}
          </p>
          {job.amount === null && <p className="mt-1 text-[12px] text-white/35">rate pending</p>}
        </div>
      </div>
    </GlassCard>
  );
}

export default function MyEarnings() {
  const [jobs, setJobs] = useState<WorkLog[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"unpaid" | "paid" | "payments">("unpaid");

  useEffect(() => {
    fetch("/api/portal/me")
      .then((r) => r.json())
      .then((d) => {
        setJobs(d.jobs || []);
        setPayments(d.payments || []);
        setTotals(d.totals || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="grid place-items-center py-20"><span className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-orchid" /></div>;
  }

  const unpaid = jobs.filter((j) => !j.paid_on);
  const paidJobs = jobs.filter((j) => j.paid_on);

  const tabs = [
    { k: "unpaid" as const, label: `Owed (${unpaid.length})` },
    { k: "paid" as const, label: `Paid (${paidJobs.length})` },
    { k: "payments" as const, label: `Payments (${payments.length})` },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="You're owed" value={money(totals?.owed ?? 0)} tone="owed" />
        <Stat label="Paid to you" value={money(totals?.paid ?? 0)} tone="paid" />
        <Stat label="Jobs logged" value={String(totals?.jobCount ?? 0)} />
      </div>

      {totals && totals.awaitingRate > 0 && (
        <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/55">
          {totals.awaitingRate} job{totals.awaitingRate > 1 ? "s" : ""} still waiting for the office to set a rate — they&apos;ll appear in your owed total once priced.
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
              tab === t.k ? "bg-gradient-to-r from-electric to-orchid text-white shadow-[0_10px_26px_-12px_rgba(182,109,199,0.9)]" : "text-white/50 hover:text-white/80"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {tab === "payments" ? (
          payments.length === 0 ? (
            <GlassCard className="p-12 text-center"><p className="text-white/50">No payments recorded yet.</p></GlassCard>
          ) : (
            payments.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}>
                <GlassCard className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <p className="font-display text-lg font-bold text-white">{day(p.paid_on)}</p>
                    <p className="mt-0.5 text-sm text-white/50">{p.method || "Payment"}{p.note ? ` · ${p.note}` : ""}</p>
                  </div>
                  <p className="font-display text-2xl font-extrabold text-emerald-300">{money(num(p.amount))}</p>
                </GlassCard>
              </motion.div>
            ))
          )
        ) : (tab === "unpaid" ? unpaid : paidJobs).length === 0 ? (
          <GlassCard className="p-12 text-center">
            <p className="text-white/50">{tab === "unpaid" ? "Nothing outstanding — you're all paid up." : "No paid jobs yet."}</p>
          </GlassCard>
        ) : (
          (tab === "unpaid" ? unpaid : paidJobs).map((j, i) => (
            <motion.div key={j.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.3) }}>
              <JobCard job={j} />
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
