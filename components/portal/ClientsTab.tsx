"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassCard } from "./PortalShell";
import type { Agency, Agent, ClientJob, AgencyPayment, JobStatus, InvoiceStatus } from "@/lib/portal/db";
import { SubContracts } from "./PublishToWorkers";
import type { PortalUser, JobAssignment } from "@/lib/portal/db";

const money = (v: number) => `$${v.toFixed(2)}`;
const num = (v: string | null) => (v === null ? 0 : Number(v) || 0);
const day = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }) : "—");

const input =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] [color-scheme:dark]";
const btn = "rounded-xl bg-gradient-to-r from-electric to-orchid px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(182,109,199,0.9)] transition hover:-translate-y-0.5 disabled:opacity-40";
const btnGhost = "rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white";

/** red = yet to be sent · orange = out for delivery · green = completed */
export const STATUS: Record<JobStatus, { label: string; cls: string; dot: string }> = {
  to_send: { label: "Waiting for dispatch", cls: "border-rose-400/35 bg-rose-500/12 text-rose-300", dot: "bg-rose-400" },
  out_for_delivery: { label: "Out for delivery", cls: "border-amber-400/35 bg-amber-500/12 text-amber-300", dot: "bg-amber-400" },
  completed: { label: "Completed", cls: "border-emerald-400/35 bg-emerald-500/12 text-emerald-300", dot: "bg-emerald-400" },
};

export const INVOICE: Record<InvoiceStatus, { label: string; cls: string }> = {
  not_sent: { label: "Invoice not sent", cls: "border-white/15 bg-white/[0.06] text-white/55" },
  sent: { label: "Invoice sent", cls: "border-sky-400/35 bg-sky-500/12 text-sky-300" },
  received: { label: "Payment received", cls: "border-emerald-400/35 bg-emerald-500/12 text-emerald-300" },
};

type Post = (body: Record<string, unknown>) => Promise<boolean>;
type Del = (entity: string, id: number) => Promise<void>;

export default function ClientsTab({
  agencies, agents, jobs, agencyPayments, post, del,
}: {
  agencies: Agency[]; agents: Agent[]; jobs: ClientJob[]; agencyPayments: AgencyPayment[];
  post: Post; del: Del;
}) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [newAgency, setNewAgency] = useState({ name: "", pricePerLeaflet: "", email: "", phone: "" });

  const totalsFor = (agencyId: number) => {
    const mine = jobs.filter((j) => j.agency_id === agencyId);
    const invoiced = mine.filter((j) => j.invoice_status !== "not_sent").reduce((t, j) => t + num(j.amount), 0);
    const received = mine.filter((j) => j.invoice_status === "received").reduce((t, j) => t + num(j.amount), 0);
    const paidRecorded = agencyPayments.filter((p) => p.agency_id === agencyId).reduce((t, p) => t + num(p.amount), 0);
    return { jobs: mine.length, invoiced, received, owed: invoiced - received, paidRecorded };
  };

  return (
    <div className="mt-6 space-y-4">
      <GlassCard className="p-6">
        <h3 className="font-display text-lg font-bold text-white">Add an agency</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-5">
          <input className={input} placeholder="Agency name" value={newAgency.name} onChange={(e) => setNewAgency({ ...newAgency, name: e.target.value })} />
          <input className={input} placeholder="Price / leaflet" inputMode="decimal" value={newAgency.pricePerLeaflet} onChange={(e) => setNewAgency({ ...newAgency, pricePerLeaflet: e.target.value })} />
          <input className={input} placeholder="Email" value={newAgency.email} onChange={(e) => setNewAgency({ ...newAgency, email: e.target.value })} />
          <input className={input} placeholder="Phone" value={newAgency.phone} onChange={(e) => setNewAgency({ ...newAgency, phone: e.target.value })} />
          <button className={btn} disabled={!newAgency.name}
            onClick={async () => { if (await post({ entity: "agency", ...newAgency })) setNewAgency({ name: "", pricePerLeaflet: "", email: "", phone: "" }); }}>
            Add agency
          </button>
        </div>
      </GlassCard>

      {!agencies.length ? (
        <GlassCard className="p-14 text-center"><p className="text-white/50">No agencies yet.</p></GlassCard>
      ) : (
        agencies.map((a) => {
          const t = totalsFor(a.id);
          const open = openId === a.id;
          return (
            <GlassCard key={a.id} className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-white">{a.name}</h3>
                  <p className="mt-1 text-sm text-white/45">
                    {a.price_per_leaflet ? `$${Number(a.price_per_leaflet).toFixed(3).replace(/0$/, "")} per leaflet` : "No rate set"}
                    {` · ${t.jobs} job${t.jobs === 1 ? "" : "s"}`}
                    {agents.filter((g) => g.agency_id === a.id).length ? ` · ${agents.filter((g) => g.agency_id === a.id).length} agent(s)` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-5">
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Owes me</p>
                    <p className="font-display text-xl font-extrabold text-amber-300">{money(t.owed)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Paid me</p>
                    <p className="font-display text-xl font-extrabold text-emerald-300">{money(t.paidRecorded)}</p>
                  </div>
                  <button onClick={() => setOpenId(open ? null : a.id)} className={btnGhost}>{open ? "Close" : "Open"}</button>
                </div>
              </div>

              {open && (
                <AgencyDetail
                  agency={a}
                  agents={agents.filter((g) => g.agency_id === a.id)}
                  jobs={jobs.filter((j) => j.agency_id === a.id)}
                  payments={agencyPayments.filter((p) => p.agency_id === a.id)}
                  post={post} del={del}
                />
              )}
            </GlassCard>
          );
        })
      )}
    </div>
  );
}

function AgencyDetail({ agency, agents, jobs, payments, post, del }: {
  agency: Agency; agents: Agent[]; jobs: ClientJob[]; payments: AgencyPayment[]; post: Post; del: Del;
}) {
  const [tab, setTab] = useState<"agents" | "jobs" | "payments" | "details">("agents");
  const [newAgent, setNewAgent] = useState({ name: "", email: "", phone: "" });
  const [pay, setPay] = useState({ amount: "", paidOn: new Date().toISOString().slice(0, 10), method: "", note: "" });
  const [d, setD] = useState({
    name: agency.name, pricePerLeaflet: agency.price_per_leaflet || "",
    email: agency.email || "", phone: agency.phone || "", address: agency.address || "",
    invoiceSeq: agency.invoice_seq != null ? String(agency.invoice_seq) : "",
  });

  const tabs = [
    { k: "agents" as const, label: `Agents (${agents.length})` },
    { k: "jobs" as const, label: `Jobs (${jobs.length})` },
    { k: "payments" as const, label: `Payments (${payments.length})` },
    { k: "details" as const, label: "Details" },
  ];

  return (
    <div className="mt-6 border-t border-white/10 pt-5">
      <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-[13px] font-bold transition ${
              tab === t.k ? "bg-white/[0.12] text-white" : "text-white/45 hover:text-white/75"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "agents" && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-4">
            <input className={input} placeholder="Agent name" value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} />
            <input className={input} placeholder="Email" value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} />
            <input className={input} placeholder="Phone" value={newAgent.phone} onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })} />
            <button className={btn} disabled={!newAgent.name}
              onClick={async () => { if (await post({ entity: "agent", agencyId: agency.id, ...newAgent })) setNewAgent({ name: "", email: "", phone: "" }); }}>
              Add agent
            </button>
          </div>
          {!agents.length ? <p className="py-4 text-sm text-white/40">No agents yet.</p> : agents.map((g) => {
            const theirJobs = jobs.filter((j) => j.agent_id === g.id);
            const owed = theirJobs.filter((j) => j.invoice_status !== "received").reduce((t, j) => t + num(j.amount), 0);
            return (
              <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <div>
                  <p className="font-semibold text-white">{g.name}</p>
                  <p className="text-[13px] text-white/45">
                    {[g.email, g.phone].filter(Boolean).join(" · ") || "No contact details"} · {theirJobs.length} job(s)
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-amber-300">{money(owed)} outstanding</span>
                  <button onClick={() => del("agent", g.id)} className="text-sm text-white/30 hover:text-rose-300">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === "jobs" && (
        <div className="mt-4 space-y-2">
          {!jobs.length ? <p className="py-4 text-sm text-white/40">No jobs for this agency yet.</p> : jobs.map((j) => (
            <div key={j.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div>
                <p className="font-semibold text-white">{j.title || `Job #${j.id}`}</p>
                <p className="text-[13px] text-white/45">
                  {j.quantity ? `${j.quantity.toLocaleString()} leaflets` : "—"}
                  {j.completed_on ? ` · completed ${day(j.completed_on)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${STATUS[j.status].cls}`}>{STATUS[j.status].label}</span>
                <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${INVOICE[j.invoice_status].cls}`}>{INVOICE[j.invoice_status].label}</span>
                <span className="font-display text-lg font-bold text-white">{money(num(j.amount))}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "payments" && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-5">
            <input className={input} placeholder="Amount" inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
            <input className={input} type="date" value={pay.paidOn} onChange={(e) => setPay({ ...pay, paidOn: e.target.value })} />
            <input className={input} placeholder="Method" value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} />
            <input className={input} placeholder="Note" value={pay.note} onChange={(e) => setPay({ ...pay, note: e.target.value })} />
            <button className={btn} disabled={!pay.amount}
              onClick={async () => { if (await post({ entity: "agencyPayment", agencyId: agency.id, ...pay })) setPay({ ...pay, amount: "", note: "" }); }}>
              Record payment
            </button>
          </div>
          {!payments.length ? <p className="py-4 text-sm text-white/40">No payments received yet.</p> : payments.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div>
                <p className="font-semibold text-white">{day(p.paid_on)}</p>
                <p className="text-[13px] text-white/45">{[p.method, p.note].filter(Boolean).join(" · ") || "Payment received"}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-lg font-extrabold text-emerald-300">{money(num(p.amount))}</span>
                <button onClick={() => del("agencyPayment", p.id)} className="text-sm text-white/30 hover:text-rose-300">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "details" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input className={input} placeholder="Agency name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
          <input className={input} placeholder="Price per leaflet" inputMode="decimal" value={String(d.pricePerLeaflet)} onChange={(e) => setD({ ...d, pricePerLeaflet: e.target.value })} />
          <input className={input} placeholder="Email" value={d.email} onChange={(e) => setD({ ...d, email: e.target.value })} />
          <input className={input} placeholder="Phone" value={d.phone} onChange={(e) => setD({ ...d, phone: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Address" value={d.address} onChange={(e) => setD({ ...d, address: e.target.value })} />
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">
              Last invoice number used for this agency
            </span>
            <input className={input} inputMode="numeric" placeholder="e.g. 6"
              value={d.invoiceSeq}
              onChange={(e) => setD({ ...d, invoiceSeq: e.target.value })} />
            <span className="mt-1 block text-[12px] text-white/30">
              Each agency runs its own numbering. The next invoice is suggested from this.
            </span>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button className={btn} onClick={() => post({ entity: "agency", id: agency.id, ...d })}>Save details</button>
            <button className="rounded-xl border border-rose-400/30 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
              onClick={() => del("agency", agency.id)}>Delete agency</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ client jobs ------------------------------- */

export function ClientJobsTab({ agencies, agents, jobs, workLogs, users, assignments, post, del }: {
  agencies: Agency[]; agents: Agent[]; jobs: ClientJob[];
  workLogs: WorkLogLite[]; users: PortalUser[]; assignments: JobAssignment[];
  post: Post; del: Del;
}) {
  const blank = {
    agencyId: "", agentId: "", title: "", area: "", quantity: "",
    ratePerLeaflet: "", status: "to_send", invoiceStatus: "not_sent",
    pickedOn: "", completedOn: "", workerPay: "", minHours: "",
  };
  const [f, setF] = useState(blank);
  const [filter, setFilter] = useState<"all" | JobStatus>("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "amount" | "agency">("newest");

  const shown = useMemo(() => {
    const base = filter === "all" ? jobs : jobs.filter((j) => j.status === filter);
    const when = (j: ClientJob) => new Date(j.completed_on || j.picked_on || j.created_at).getTime();
    const copy = [...base];
    if (sort === "newest") copy.sort((a, b) => when(b) - when(a));
    if (sort === "oldest") copy.sort((a, b) => when(a) - when(b));
    if (sort === "amount") copy.sort((a, b) => num(b.amount) - num(a.amount));
    if (sort === "agency") copy.sort((a, b) => (agencies.find((x) => x.id === a.agency_id)?.name || "").localeCompare(agencies.find((x) => x.id === b.agency_id)?.name || ""));
    return copy;
  }, [jobs, filter, sort, agencies]);

  const agencyName = (id: number | null) => agencies.find((a) => a.id === id)?.name || "Unassigned agency";
  const agentName = (id: number | null) => agents.find((a) => a.id === id)?.name || null;

  // Picking an agency pre-fills its per-leaflet rate.
  const chooseAgency = (id: string) => {
    const a = agencies.find((x) => String(x.id) === id);
    setF((p) => ({ ...p, agencyId: id, agentId: "", ratePerLeaflet: a?.price_per_leaflet ? String(a.price_per_leaflet) : p.ratePerLeaflet }));
  };

  return (
    <div className="mt-6 space-y-4">
      <GlassCard className="p-6">
        <h3 className="font-display text-lg font-bold text-white">Add a job</h3>
        <p className="mt-1 text-[13px] text-white/40">Your internal record. Publish it to workers from the Workers tab.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select className={input} value={f.agencyId} onChange={(e) => chooseAgency(e.target.value)}>
            <option value="">Agency…</option>
            {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <select className={input} value={f.agentId} onChange={(e) => {
              const ag = agents.find((x) => String(x.id) === e.target.value);
              const agencyId = ag ? String(ag.agency_id) : f.agencyId;
              const rate = agencies.find((x) => String(x.id) === agencyId)?.price_per_leaflet;
              setF({ ...f, agentId: e.target.value, agencyId, ratePerLeaflet: rate ? String(rate) : f.ratePerLeaflet });
            }}>
            <option value="">Agent (optional)…</option>
            {agents.filter((g) => String(g.agency_id) === f.agencyId).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <input className={input} placeholder="Job title / description" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />

          <input className={input} placeholder="Area" value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} />
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">Leaflet amount</span>
            <input className={input} placeholder="e.g. 2000" inputMode="numeric" value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-orchid">Leaflet rate — what the agency pays you</span>
            <input className={input} placeholder="e.g. 0.13" inputMode="decimal" value={f.ratePerLeaflet} onChange={(e) => setF({ ...f, ratePerLeaflet: e.target.value })} />
          </label>

          <select className={input} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="to_send">Waiting for dispatch</option>
            <option value="out_for_delivery">Out for delivery</option>
            <option value="completed">Completed</option>
          </select>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">Pick-up date (optional)</span>
            <input className={input} type="date" value={f.pickedOn} onChange={(e) => setF({ ...f, pickedOn: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[12px] font-semibold text-white/40">Completion date (optional)</span>
            <input className={input} type="date" value={f.completedOn} onChange={(e) => setF({ ...f, completedOn: e.target.value })} />
          </label>

          <div className="sm:col-span-3">
            <button className={btn} disabled={!f.agencyId && !f.title}
              onClick={async () => { if (await post({ entity: "job", ...f })) setF(blank); }}>
              Add job
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "to_send", "out_for_delivery", "completed"] as const).map((k) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full border px-4 py-2 text-[13px] font-bold transition ${
              filter === k ? "border-white/25 bg-white/[0.12] text-white" : "border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80"}`}>
            {k === "all" ? `All (${jobs.length})` : `${STATUS[k].label} (${jobs.filter((j) => j.status === k).length})`}
          </button>
        ))}
        <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}
          className={`${input} ml-auto !w-auto`} aria-label="Sort jobs">
          <option value="newest">Sort: newest first</option>
          <option value="oldest">Sort: oldest first</option>
          <option value="amount">Sort: highest value</option>
          <option value="agency">Sort: agency A–Z</option>
        </select>
      </div>

      {!shown.length ? (
        <GlassCard className="p-14 text-center"><p className="text-white/50">No jobs here yet.</p></GlassCard>
      ) : shown.map((j) => (
        <ClientJobRow key={j.id} job={j}
          agencyName={agencyName(j.agency_id)} agentName={agentName(j.agent_id)}
          agencies={agencies} agents={agents}
          expenses={workLogs.filter((w) => w.client_job_id === j.id)}
          users={users} assignments={assignments.filter((a) => a.job_id === j.id)}
          post={post} del={del} />
      ))}
    </div>
  );
}

export type WorkLogLite = {
  id: number; client_job_id: number | null; user_id: number | null;
  worker_name: string; amount: string | null; paid_on: string | null;
};

/** An invoice sitting on "sent" for over a week needs chasing. */
export function effectiveInvoice(job: ClientJob): InvoiceStatus | "follow_up" {
  if (job.invoice_status === "received") return "received";
  if (job.invoice_status !== "sent") return job.invoice_status;
  const sent = job.invoice_date || job.completed_on;
  if (!sent) return "sent";
  const days = (Date.now() - new Date(sent).getTime()) / 86400000;
  return days > 7 ? "follow_up" : "sent";
}

const INVOICE_VIEW: Record<string, { label: string; cls: string }> = {
  not_sent: { label: "Invoice not sent", cls: "border-white/15 bg-white/[0.06] text-white/55" },
  sent: { label: "Invoice sent", cls: "border-amber-400/40 bg-amber-500/12 text-amber-300" },
  follow_up: { label: "Follow up", cls: "border-rose-400/45 bg-rose-500/15 text-rose-300" },
  received: { label: "Paid", cls: "border-emerald-400/40 bg-emerald-500/12 text-emerald-300" },
};

const seed = (j: ClientJob) => ({
  agencyId: j.agency_id ? String(j.agency_id) : "",
  agentId: j.agent_id ? String(j.agent_id) : "",
  title: j.title || "", area: j.area || "",
  quantity: j.quantity != null ? String(j.quantity) : "",
  ratePerLeaflet: j.rate_per_leaflet != null ? String(j.rate_per_leaflet) : "",
  pickedOn: j.picked_on || "", completedOn: j.completed_on || "", notes: j.notes || "",
});

function ClientJobRow({ job, agencyName, agentName, agencies, agents, expenses, users, assignments, post, del }: {
  job: ClientJob; agencyName: string; agentName: string | null;
  agencies: Agency[]; agents: Agent[];
  expenses: WorkLogLite[]; users: PortalUser[]; assignments: JobAssignment[];
  post: Post; del: Del;
}) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [e, setE] = useState(() => seed(job));
  // Each agency numbers its own invoices, so the suggestion follows theirs.
  const agencySeq = agencies.find((a) => a.id === job.agency_id)?.invoice_seq ?? null;
  const nextInvoiceNo = agencySeq != null ? String(agencySeq + 1) : "";
  // Re-seed when the job changes underneath us (another save, a refresh).
  useEffect(() => { if (!editing) setE(seed(job)); }, [job, editing]);
  const s = STATUS[job.status];
  const inv = effectiveInvoice(job);
  // Three buckets across the job's quantity: completed, out with a worker, and
  // still waiting to be dispatched. A completed job counts as fully delivered
  // unless a partial figure was entered.
  const qty = job.quantity ?? 0;
  const delivered = job.delivered_count ?? (job.status === "completed" ? qty : 0);
  const out = Math.max(0, Math.min(job.out_count ?? (job.status === "out_for_delivery" && !job.delivered_count ? qty : 0), qty - delivered));
  const remaining = Math.max(0, qty - delivered - out);
  const revenue = num(job.amount);
  const labour = expenses.reduce((t, w) => t + num(w.amount), 0);
  const profit = revenue - labour;
  const nameOf = (w: WorkLogLite) => users.find((u) => u.id === w.user_id)?.full_name || w.worker_name;

  return (
    <GlassCard className={`border-l-4 p-5 ${
      job.status === "completed" ? "border-l-emerald-400" : job.status === "out_for_delivery" ? "border-l-amber-400" : "border-l-rose-400"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {/* Agency — Agent is the header, the job title sits under it. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.dot}`} />
            <h3 className="font-display text-lg font-bold text-white">
              {agencyName}{agentName ? <span className="text-white/55"> — {agentName}</span> : null}
            </h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-[15px] font-semibold text-white/75">{job.title || `Job #${job.id}`}</p>
            <span className="rounded-md bg-white/[0.08] px-2 py-0.5 font-mono text-[11px] text-white/60">
              {job.job_number || `#${job.id}`}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-white/45">
            {job.quantity ? `${job.quantity.toLocaleString()} leaflets` : "—"}
            {job.rate_per_leaflet ? ` @ $${Number(job.rate_per_leaflet).toFixed(2)}` : ""}
            {job.area ? ` · ${job.area}` : ""}
          </p>
          <p className="mt-1 text-[13px] text-white/40">
            Picked {job.picked_on ? day(job.picked_on) : "—"} · Completed {job.completed_on ? day(job.completed_on) : "—"}
          </p>

          {job.quantity ? (
            <div className="mt-3 max-w-sm">
              <div className="flex items-center justify-between text-[12px]">
                <span className="text-white/55">
                  <span className="font-semibold text-emerald-300">{delivered.toLocaleString()}</span> completed
                  {out > 0 && (<>{" · "}<span className="font-semibold text-amber-300">{out.toLocaleString()}</span> out</>)}
                  {remaining > 0 && (<>{" · "}<span className="font-semibold text-rose-300">{remaining.toLocaleString()}</span> to dispatch</>)}
                </span>
                <span className="text-white/35">of {job.quantity.toLocaleString()}</span>
              </div>
              <div className="mt-1.5 flex h-1.5 overflow-hidden rounded-full bg-rose-400/25">
                <div className="h-full bg-emerald-400" style={{ width: `${(delivered / qty) * 100}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${(out / qty) * 100}%` }} />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold text-white">{money(revenue)}</p>
            {job.invoice_status === "not_sent" ? (
              <p className="text-[13px] font-bold text-white/40">Owed — not invoiced</p>
            ) : (
              <p className={`text-[13px] font-bold ${profit >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                Profit {money(profit)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <select className={`${input} !w-auto !py-2`} value={job.status}
              onChange={(e) => post({ entity: "job", id: job.id, ...jobPayload(job), status: e.target.value })}>
              <option value="to_send">Waiting for dispatch</option>
              <option value="out_for_delivery">Out for delivery</option>
              <option value="completed">Completed</option>
            </select>
            <select className={`${input} !w-auto !py-2`} value={job.invoice_status}
              onChange={(e) => post({ entity: "job", id: job.id, ...jobPayload(job), invoiceStatus: e.target.value })}>
              <option value="not_sent">Invoice not sent</option>
              <option value="sent">Invoice sent</option>
              <option value="received">Paid</option>
            </select>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase ${INVOICE_VIEW[inv].cls}`}>
            {INVOICE_VIEW[inv].label}
            {inv === "received" && job.invoice_date ? ` ${day(job.invoice_date)}` : ""}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5"
              title="Leave the invoice number off this one">
              <input type="checkbox" className="h-3.5 w-3.5 accent-[#7c3aed]"
                checked={Boolean(job.invoice_no_hidden)}
                onChange={(e) => post({
                  entity: "job", id: job.id, ...jobPayload(job),
                  invoiceNoHidden: e.target.checked,
                  invoiceNo: e.target.checked ? null : job.invoice_no,
                })} />
              <span className="text-[11px] font-semibold text-white/50">No number</span>
            </label>
            {!job.invoice_no_hidden && (
              <input className={`${input} !w-28 !py-1.5 !text-[12px]`}
                placeholder={nextInvoiceNo ? `no. ${nextInvoiceNo}` : "Invoice no."}
                defaultValue={job.invoice_no || ""} aria-label="Invoice number" key={job.invoice_no || "blank"}
                onBlur={(e) => { if (e.target.value !== (job.invoice_no || "")) post({ entity: "job", id: job.id, ...jobPayload(job), invoiceNo: e.target.value }); }} />
            )}
            {!job.invoice_no_hidden && !job.invoice_no && nextInvoiceNo && (
              <button
                onClick={() => post({
                  entity: "job", id: job.id, ...jobPayload(job), invoiceNo: nextInvoiceNo,
                  agencyInvoiceSeq: Number(nextInvoiceNo),
                })}
                className="rounded-lg border border-orchid/40 bg-orchid/10 px-2.5 py-1.5 text-[11px] font-bold text-orchid transition hover:bg-orchid/20">
                Use {nextInvoiceNo}
              </button>
            )}
            <input type="date" className={`${input} !w-auto !py-1.5 !text-[12px]`}
              value={job.invoice_date || ""} aria-label="Invoice / paid date"
              onChange={(e) => post({ entity: "job", id: job.id, ...jobPayload(job), invoiceDate: e.target.value })} />
            <Link href={`/portal/admin/invoice/${job.id}`} className={btnGhost}>Invoice PDF ↗</Link>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setOpen((v) => !v)} className="text-sm font-semibold text-white/50 transition hover:text-white">
              {open ? "Close" : `Assign work${assignments.length ? ` (${assignments.length})` : ""}`}
            </button>
            <button onClick={() => del("job", job.id)} className="text-sm text-white/30 transition hover:text-rose-300">Delete</button>
          </div>
        </div>
      </div>

      {open && (
        <div className="mt-5 border-t border-white/10 pt-4">
          <button onClick={() => setEditing((v) => !v)}
            className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]">
            <span>
              <span className="block text-[14px] font-bold text-white">Edit job details</span>
              <span className="mt-0.5 block text-[12px] text-white/45">
                Leaflets, rate, area, agency and dates \u2014 changeable at any time.
              </span>
            </span>
            <span className={`shrink-0 text-white/40 transition-transform ${editing ? "rotate-180" : ""}`}>\u25be</span>
          </button>

          {editing && (
            <div className="mb-5 rounded-2xl border border-white/12 bg-white/[0.03] p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Agency</span>
                  <select className={input} value={e.agencyId} onChange={(ev) => setE({ ...e, agencyId: ev.target.value })}>
                    <option value="">Unassigned</option>
                    {agencies.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Agent</span>
                  <select className={input} value={e.agentId} onChange={(ev) => setE({ ...e, agentId: ev.target.value })}>
                    <option value="">None</option>
                    {agents.filter((g) => !e.agencyId || String(g.agency_id) === e.agencyId)
                      .map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Title</span>
                  <input className={input} value={e.title} onChange={(ev) => setE({ ...e, title: ev.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Area</span>
                  <input className={input} value={e.area} onChange={(ev) => setE({ ...e, area: ev.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Leaflet amount</span>
                  <input className={input} inputMode="numeric" value={e.quantity} onChange={(ev) => setE({ ...e, quantity: ev.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-orchid">Leaflet rate \u2014 what the agency pays you</span>
                  <input className={input} inputMode="decimal" value={e.ratePerLeaflet} onChange={(ev) => setE({ ...e, ratePerLeaflet: ev.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Pick-up date</span>
                  <input type="date" className={input} value={e.pickedOn} onChange={(ev) => setE({ ...e, pickedOn: ev.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Completion date</span>
                  <input type="date" className={input} value={e.completedOn} onChange={(ev) => setE({ ...e, completedOn: ev.target.value })} />
                </label>
                <label className="block sm:col-span-3">
                  <span className="mb-1 block text-[12px] font-semibold text-white/40">Notes</span>
                  <input className={input} value={e.notes} onChange={(ev) => setE({ ...e, notes: ev.target.value })} />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button className={btn}
                  onClick={async () => {
                    const ok = await post({
                      entity: "job", id: job.id, ...jobPayload(job),
                      agencyId: e.agencyId || null, agentId: e.agentId || null,
                      title: e.title, area: e.area,
                      quantity: e.quantity === "" ? null : e.quantity,
                      ratePerLeaflet: e.ratePerLeaflet === "" ? null : e.ratePerLeaflet,
                      amount: e.quantity && e.ratePerLeaflet
                        ? (Number(e.quantity) * Number(e.ratePerLeaflet)).toFixed(2)
                        : job.amount,
                      pickedOn: e.pickedOn || null, completedOn: e.completedOn || null,
                      notes: e.notes || null,
                    });
                    if (ok) setEditing(false);
                  }}>
                  Save job
                </button>
                <button onClick={() => { setE(seed(job)); setEditing(false); }}
                  className="text-[13px] font-semibold text-white/40 transition hover:text-white">Cancel</button>
                {e.quantity && e.ratePerLeaflet && (
                  <span className="text-[13px] text-white/45">
                    Revenue becomes ${(Number(e.quantity) * Number(e.ratePerLeaflet)).toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-white/40">Job number</span>
              <input className={input} defaultValue={job.job_number || ""} placeholder={`#${job.id}`}
                onBlur={(e) => { if (e.target.value !== (job.job_number || "")) post({ entity: "job", id: job.id, ...jobPayload(job), jobNumber: e.target.value, deliveredCount: job.delivered_count }); }} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-amber-300">Out for delivery</span>
              <input className={input} inputMode="numeric" defaultValue={job.out_count ?? ""} placeholder="e.g. 200"
                onBlur={(e) => { if (String(e.target.value) !== String(job.out_count ?? "")) post({ entity: "job", id: job.id, ...jobPayload(job), outCount: e.target.value }); }} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-emerald-300">Completed delivery</span>
              <input className={input} inputMode="numeric" defaultValue={job.delivered_count ?? ""} placeholder={job.status === "completed" ? `all ${job.quantity ?? 0}` : "e.g. 300"}
                onBlur={(e) => { if (String(e.target.value) !== String(job.delivered_count ?? "")) post({ entity: "job", id: job.id, ...jobPayload(job), jobNumber: job.job_number, deliveredCount: e.target.value }); }} />
            </label>
            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-rose-300">Yet to be dispatched</span>
              <input
                readOnly
                value={qty ? remaining.toLocaleString() : ""}
                placeholder={qty ? "" : "set a quantity"}
                aria-label="Yet to be dispatched"
                className={`${input} cursor-default border-rose-400/30 bg-rose-500/10 text-rose-200`}
              />
            </label>
          </div>
          {/* Assign the work: who does what, for how much, by when. */}
          <div className="mb-5">
            <SubContracts job={job} users={users} rows={assignments} post={post} del={del} />
          </div>

          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-white/40">Worker costs on this job</p>
          {!expenses.length ? (
            <p className="mt-2 text-sm text-white/40">No worker payments recorded against this job yet.</p>
          ) : (
            <div className="mt-3 space-y-1.5">
              {expenses.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3.5 py-2 text-sm">
                  <span className="text-white/75">{nameOf(w)}</span>
                  <span className="flex items-center gap-3">
                    <span className={w.paid_on ? "text-emerald-300" : "text-amber-300"}>{w.paid_on ? "paid" : "unpaid"}</span>
                    <span className="font-semibold text-white">{money(num(w.amount))}</span>
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-white/10 px-3.5 pt-2.5 text-sm">
                <span className="font-semibold text-white/70">Total costs</span>
                <span className="font-display text-lg font-extrabold text-white">{money(labour)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </GlassCard>
  );
}

/** Keeps the other columns intact when only one dropdown changes. */
function jobPayload(j: ClientJob) {
  return {
    agencyId: j.agency_id, agentId: j.agent_id, title: j.title, area: j.area,
    leafletType: j.leaflet_type, quantity: j.quantity, ratePerLeaflet: j.rate_per_leaflet,
    amount: j.amount, status: j.status, invoiceStatus: j.invoice_status,
    invoiceNo: j.invoice_no, invoiceDate: j.invoice_date,
    pickedOn: j.picked_on, completedOn: j.completed_on, notes: j.notes,
    jobNumber: j.job_number, deliveredCount: j.delivered_count, outCount: j.out_count,
  };
}
