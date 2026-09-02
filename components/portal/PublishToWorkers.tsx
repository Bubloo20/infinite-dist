"use client";

import { useMemo, useRef, useState } from "react";
import { GlassCard, ActionButton } from "./PortalShell";
import { tidyHours, formatHours } from "@/lib/portal/text";
import BoundaryMap, { type AreaSpec, EMPTY_SPEC, parseSpec, specHasDrawing, countPoints } from "./BoundaryMap";
import ImageDrop from "./ImageDrop";
import type { Agency, ClientJob, PortalUser, JobInterest, JobAssignment } from "@/lib/portal/db";
import DateInput from "./DateInput";

const input =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] [color-scheme:dark]";
const btn =
  "rounded-xl bg-gradient-to-r from-electric to-orchid px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(182,109,199,0.9)] transition hover:-translate-y-0.5 disabled:opacity-40";
const btnGhost =
  "rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white";

/** Each worker's allocated time is their own start-to-due window. */
export function spanOf(start: string | null | undefined, due: string | null | undefined): string {
  const day = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short" });
  if (!start || !due) return "set start and due";
  const a = new Date(`${start}T00:00:00`).getTime();
  const b = new Date(`${due}T00:00:00`).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return "set start and due";
  const days = Math.round((b - a) / 86400000) + 1;
  return `${day(start)} – ${day(due)} · ${days === 1 ? "1 day" : `${days} days`}`;
}

const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try { const v = JSON.parse(s); return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null; } catch { return null; }
};

/**
 * Turns an internal job into a worker-facing offer: pay, hours, the delivery
 * boundary, and either a direct assignment or a marketplace listing.
 */
export default function PublishToWorkers({
  jobs, agencies, users, interest, assignments, post, del,
}: {
  jobs: ClientJob[]; agencies: Agency[]; users: PortalUser[];
  interest: JobInterest[]; assignments: JobAssignment[];
  post: (body: Record<string, unknown>) => Promise<boolean>;
  del: (entity: string, id: number) => Promise<void>;
}) {
  const [jobId, setJobId] = useState("");
  const [f, setF] = useState({ workerPay: "", allocatedTime: "", minHours: "" });
  const [mode, setMode] = useState<"market" | "assign">("market");
  const [assignTo, setAssignTo] = useState("");
  const [spec, setSpec] = useState<AreaSpec>(EMPTY_SPEC);
  const [center, setCenter] = useState<[number, number, number] | null>(null);
  const [showMap, setShowMap] = useState(false);

  const job = useMemo(() => jobs.find((j) => String(j.id) === jobId) || null, [jobs, jobId]);
  const agencyOf = (j: ClientJob) => agencies.find((a) => a.id === j.agency_id)?.name || "Unassigned";
  const nameOf = (id: number) => users.find((u) => u.id === id)?.full_name || `User ${id}`;

  // Load whatever is already on the job when it's picked.
  const pick = (id: string) => {
    setJobId(id);
    const j = jobs.find((x) => String(x.id) === id);
    setF({
      workerPay: j?.worker_pay ? String(j.worker_pay) : "",
      allocatedTime: j?.allocated_time || "",
      minHours: j?.min_hours || "",
    });
    setSpec(parseSpec(j?.boundary ?? null));
    setAssignTo(j?.assigned_user_id ? String(j.assigned_user_id) : "");
    setMode(j?.assigned_user_id ? "assign" : "market");
  };

  const publish = async () => {
    if (!job) return;
    const ok = await post({
      entity: "job", id: job.id,
      agencyId: job.agency_id, agentId: job.agent_id, title: job.title, area: job.area,
      quantity: job.quantity, ratePerLeaflet: job.rate_per_leaflet, amount: job.amount,
      status: job.status, invoiceStatus: job.invoice_status,
      invoiceNo: job.invoice_no, invoiceDate: job.invoice_date,
      pickedOn: job.picked_on, completedOn: job.completed_on, notes: job.notes,
      jobNumber: job.job_number, deliveredCount: job.delivered_count,
      workerPay: f.workerPay, allocatedTime: f.allocatedTime, minHours: f.minHours,
      boundary: specHasDrawing(spec) ? JSON.stringify(spec) : null,
      mapCenter: center ? JSON.stringify(center) : job.map_center,
      published: mode === "market",
      assignedUserId: mode === "assign" ? assignTo || null : null,
    });
    if (ok) { setJobId(""); setSpec(EMPTY_SPEC); setShowMap(false); setF({ workerPay: "", allocatedTime: "", minHours: "" }); }
  };

  const live = jobs.filter((j) => j.published || j.assigned_user_id);

  return (
    <div className="space-y-4">
      <GlassCard className="p-6">
        <h3 className="font-display text-lg font-bold text-white">Publish a job to workers</h3>
        <p className="mt-1 text-[13px] text-white/40">
          Pick a job you&apos;ve already added, set what the worker gets, then either assign it to someone or list it on the marketplace.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <select className={`${input} sm:col-span-3`} value={jobId} onChange={(e) => pick(e.target.value)}>
            <option value="">Choose a job…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {agencyOf(j)} — {j.title || `Job #${j.id}`}{j.quantity ? ` (${j.quantity.toLocaleString()} leaflets)` : ""}
              </option>
            ))}
          </select>

          {job && (
            <>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-emerald-300">Payment amount — total $ to the worker</span>
                <input className={input} placeholder="e.g. 120" inputMode="decimal" value={f.workerPay} onChange={(e) => setF({ ...f, workerPay: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-white/40">Allocated time</span>
                <input className={input} placeholder="e.g. 3 days" value={f.allocatedTime} onChange={(e) => setF({ ...f, allocatedTime: e.target.value })} />
              </label>
              <label className="block">
                <span className="mb-1 block text-[12px] font-semibold text-white/40">Minimum hours</span>
                <input className={input} placeholder="e.g. 3.5 or 3 hours 30 mins" value={f.minHours}
                  onChange={(e) => setF({ ...f, minHours: e.target.value })}
                  onBlur={(e) => setF((p) => ({ ...p, minHours: tidyHours(e.target.value) }))} />
              </label>

              <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowMap((v) => !v)} className={btnGhost}>
                  {showMap ? "Hide map" : countPoints(spec) ? `Delivery area (${countPoints(spec)} points)` : "Draw delivery area"}
                </button>
                <div className="ml-auto flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
                  {([["market", "List on marketplace"], ["assign", "Assign to a worker"]] as const).map(([k, label]) => (
                    <button key={k} type="button" onClick={() => setMode(k)}
                      className={`rounded-lg px-3.5 py-2 text-[13px] font-bold transition ${
                        mode === k ? "bg-white/[0.12] text-white" : "text-white/45 hover:text-white/75"}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {mode === "assign" && (
                  <select className={`${input} !w-auto`} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                    <option value="">Choose worker…</option>
                    {users.map((u) => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                )}
              </div>

              {showMap && (
                <div className="sm:col-span-3">
                  <p className="mb-2 text-[13px] text-white/45">
                    Click to trace the boundary. The worker gets this as a map they can zoom to street level.
                  </p>
                  <BoundaryMap spec={spec} editable expandable height={420} onChange={(sp, c) => { setSpec(sp); setCenter(c); }} />
                </div>
              )}

              <div className="sm:col-span-3">
                <ActionButton className={btn} onClick={publish} disabled={mode === "assign" && !assignTo} busyLabel="Sending…">
                  {mode === "assign" ? "Assign to worker" : "Publish to marketplace"}
                </ActionButton>
                <p className="mt-2 text-[13px] text-white/35">
                  The contractor agreement fills in from these details for the worker to read and sign.
                </p>
              </div>

              <div className="sm:col-span-3">
                <SubContracts job={job} users={users}
                  rows={assignments.filter((a) => a.job_id === job.id)}
                  post={post} del={del} />
              </div>
            </>
          )}
        </div>
      </GlassCard>

      {/* What's already out there, and who has responded. */}
      {live.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="font-display text-lg font-bold text-white">Live with workers</h3>
          <div className="mt-4 space-y-3">
            {live.map((j) => {
              const responses = interest.filter((i) => i.job_id === j.id);
              const keen = responses.filter((r) => (r.note || "").indexOf("[declined]") !== 0);
              const declined = responses.filter((r) => (r.note || "").indexOf("[declined]") === 0);
              return (
                <div key={j.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">{j.title || `Job #${j.id}`}</p>
                      <p className="text-[13px] text-white/45">
                        {agencyOf(j)}
                        {j.worker_pay ? ` · $${Number(j.worker_pay).toFixed(2)} to worker` : ""}
                        {j.assigned_user_id ? ` · assigned to ${nameOf(j.assigned_user_id)}` : " · on marketplace"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {j.assigned_user_id && (
                        <>
                          <a href={`/portal/admin/contract/${j.id}`} className={btnGhost}>Signed contract ↗</a>
                          <a href={`/portal/admin/timesheet/${j.id}`} className={btnGhost}>Timesheet ↗</a>
                        </>
                      )}
                      <button className={btnGhost}
                        onClick={() => post({
                          entity: "job", id: j.id, agencyId: j.agency_id, agentId: j.agent_id, title: j.title,
                          area: j.area, quantity: j.quantity, ratePerLeaflet: j.rate_per_leaflet, amount: j.amount,
                          status: j.status, invoiceStatus: j.invoice_status, published: false, assignedUserId: null,
                        })}>
                        Unpublish
                      </button>
                    </div>
                  </div>

                  {responses.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
                      {keen.map((r) => (
                        <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                          <span className="text-emerald-300">✓ {nameOf(r.user_id)} is interested</span>
                          {r.note && <span className="text-white/50">“{r.note}”</span>}
                          <button onClick={() => post({
                            entity: "job", id: j.id, agencyId: j.agency_id, agentId: j.agent_id, title: j.title,
                            area: j.area, quantity: j.quantity, ratePerLeaflet: j.rate_per_leaflet, amount: j.amount,
                            status: j.status, invoiceStatus: j.invoice_status,
                            published: false, assignedUserId: r.user_id,
                          })} className="text-[13px] font-bold text-orchid hover:text-white">Assign to them →</button>
                        </div>
                      ))}
                      {declined.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-sm">
                          <span className="text-rose-300/80">✕ {nameOf(r.user_id)} declined</span>
                          <span className="text-white/40">{(r.note || "").replace("[declined]", "").trim()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

/**
 * Splits one job between several workers. Each row is its own sub-contract with
 * its own pay, leaflet share and dates, so three people can run the same job on
 * different schedules.
 */
/**
 * What a run is worth, and roughly how long it takes.
 *
 * Under 500 leaflets pays 7c each; from 500 up it's 6.5c. A thousand leaflets
 * is about three and a half hours on foot, so the minimum scales from that.
 * Both are only ever suggestions — typing your own figure keeps it.
 */
const payFor = (leaflets: number) =>
  leaflets <= 0 ? "" : (leaflets * (leaflets < 500 ? 0.07 : 0.065)).toFixed(2);

const minHoursFor = (leaflets: number) =>
  leaflets <= 0 ? "" : formatHours(leaflets * 3.5 / 1000);

/**
 * Whether this run may go into letterboxes marked "No Junk Mail".
 *
 * It decides how the street is actually walked, so it's asked per sub-contract
 * and spelled out rather than left as jargon on a checkbox.
 */
function JunkMailToggle({ value, onChange, tone = "dark" }: {
  value: boolean;
  onChange: (v: boolean) => void;
  tone?: "dark" | "plain";
}) {
  const [why, setWhy] = useState(false);
  return (
    <div className={tone === "dark" ? "rounded-xl border border-white/12 bg-white/[0.04] px-3.5 py-2.5" : ""}>
      <div className="flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-white/75">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 shrink-0 accent-orchid"
          />
          <span>
            Junk mail allowed
            <span className={`ml-2 rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase ${
              value ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.08] text-white/45"}`}>
              {value ? "Yes" : "No"}
            </span>
          </span>
        </label>
        <button
          type="button"
          aria-label="What does junk mail allowed mean?"
          aria-expanded={why}
          onClick={() => setWhy((v) => !v)}
          className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-white/25 text-[11px] font-bold text-white/55 transition hover:border-white/50 hover:text-white"
        >
          i
        </button>
      </div>
      {why && (
        <p className="mt-2 max-w-md text-[12px] leading-relaxed text-white/55">
          Whether the worker may put leaflets in letterboxes marked
          &ldquo;No Junk Mail&rdquo;. <span className="font-semibold text-white/75">Yes</span> — every box on
          the street. <span className="font-semibold text-white/75">No</span> — skip any that say no junk
          mail, addressed items only.
        </p>
      )}
    </div>
  );
}

export function SubContracts({ job, users, rows, post, del }: {
  job: ClientJob; users: PortalUser[]; rows: JobAssignment[];
  post: (body: Record<string, unknown>) => Promise<boolean>;
  del: (entity: string, id: number) => Promise<void>;
}) {
  const blank = {
    userId: "", title: "", junkMailAllowed: false, pay: "", leafletShare: "", areaNote: "",
    startDate: "", dueDate: "", minHours: "", allocatedTime: "", mapImage: "",
    boundary: "", mapCenter: "",
  };
  const [f, setF] = useState(blank);
  // Once either of these is typed in by hand it stops following the leaflet count.
  const ownPay = useRef(false);
  const ownHours = useRef(false);
  const [tracing, setTracing] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [payRow, setPayRow] = useState<number | null>(null);
  const [payDraft, setPayDraft] = useState("");
  const blankEdit = {
    who: "", title: "", junk: false, pay: "", leaflets: "",
    area: "", start: "", due: "", minHours: "",
  };
  const [ed, setEd] = useState(blankEdit);
  // Reset each time a row is opened, so one row's manual pay doesn't stick to
  // the next one.
  const ownPayEdit = useRef(false);
  const ownHoursEdit = useRef(false);
  const [editSpec, setEditSpec] = useState<AreaSpec>(EMPTY_SPEC);
  const [editCenter, setEditCenter] = useState<[number, number, number] | null>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const traceSpec = parseSpec(f.boundary || null);

  const nameOf = (id: number) => users.find((u) => u.id === id)?.full_name || `User ${id}`;
  const shortDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : null;

  /** A stored date as the date box wants it, read in local time. */
  const toDateInput = (v: string | null) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const taken = rows.reduce((t, r) => t + (r.leaflet_share || 0), 0);
  const payTotal = rows.reduce((t, r) => t + Number(r.pay || 0), 0);
  const left = (job.quantity ?? 0) - taken;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="font-display text-base font-bold text-white">Sub-contracts for this job</h4>
        <p className="text-[13px] text-white/40">
          {rows.length
            ? `${rows.length} worker${rows.length === 1 ? "" : "s"} · $${payTotal.toFixed(2)} allocated${
                job.quantity ? ` · ${taken.toLocaleString()} of ${job.quantity.toLocaleString()} leaflets shared out` : ""}`
            : "Split this job between several workers, each on their own pay, dates and name for the work."}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white/[0.04] px-4 py-3 ${
              editing === r.id ? "border-orchid/40" : "border-white/10"}`}>
              <div>
                <p className="font-semibold text-white">
                  {nameOf(r.user_id)}
                  {r.title ? <span className="text-white/45"> — {r.title}</span> : null}
                </p>
                <p className="text-[13px] text-white/45">
                  {r.leaflet_share ? `${r.leaflet_share.toLocaleString()} leaflets` : "share not set"}
                  {r.area_note ? ` · ${r.area_note}` : ""}
                  {shortDate(r.start_date) ? ` · starts ${shortDate(r.start_date)}` : ""}
                  {shortDate(r.due_date) ? ` · due ${shortDate(r.due_date)}` : ""}
                </p>
                <p className="text-[13px] text-white/35">
                  {r.min_hours ? `min ${tidyHours(r.min_hours)}` : "no minimum set"}
                  {r.allocated_time ? ` · ${r.allocated_time}` : ""}
                  {r.map_image ? " · area diagram attached" : ""}
                  {specHasDrawing(parseSpec(r.boundary)) ? " · area drawn on map" : ""}
                  {r.junk_mail_allowed ? " · junk mail allowed" : " · no junk mail"}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {/*
                  Pay is changed here rather than buried in the map panel. If
                  they've already signed, changing it means they signed for a
                  different number — the portal asks them to agree to the new
                  one before they carry on.
                */}
                {payRow === r.id ? (
                  <span className="flex items-center gap-1.5">
                    <span className="font-display text-lg font-extrabold text-emerald-300">$</span>
                    <input
                      autoFocus
                      inputMode="decimal"
                      value={payDraft}
                      onChange={(ev) => setPayDraft(ev.target.value.replace(/[^0-9.]/g, ""))}
                      onKeyDown={(ev) => {
                        if (ev.key === "Enter") ev.currentTarget.blur();
                        if (ev.key === "Escape") { setPayRow(null); }
                      }}
                      onBlur={async () => {
                        const next = payDraft === "" ? null : Number(payDraft);
                        setPayRow(null);
                        if (next === null || Number.isNaN(next)) return;
                        if (Math.abs(next - Number(r.pay || 0)) < 0.005) return;   // nothing moved
                        await post({
                          entity: "assignment", id: r.id, jobId: job.id, userId: r.user_id,
                          title: r.title, junkMailAllowed: r.junk_mail_allowed,
                          pay: next, leafletShare: r.leaflet_share, areaNote: r.area_note,
                          startDate: r.start_date, dueDate: r.due_date, status: r.status,
                          minHours: r.min_hours, allocatedTime: r.allocated_time,
                        });
                      }}
                      className="w-24 rounded-lg border border-white/25 bg-night/80 px-2 py-1 text-right font-display text-lg font-extrabold text-emerald-300 outline-none"
                    />
                  </span>
                ) : (
                  <button
                    type="button"
                    title="Click to change what this worker is paid"
                    onClick={() => { setPayDraft(String(Number(r.pay || 0).toFixed(2))); setPayRow(r.id); }}
                    className="font-display text-lg font-extrabold text-emerald-300 underline decoration-dotted decoration-emerald-300/40 underline-offset-4 transition hover:text-emerald-200">
                    ${Number(r.pay || 0).toFixed(2)}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editing === r.id) { setEditing(null); return; }
                    setEditing(r.id);
                    ownPayEdit.current = false;
                    ownHoursEdit.current = false;
                    setEd({
                      who: String(r.user_id),
                      title: r.title || "",
                      junk: Boolean(r.junk_mail_allowed),
                      pay: r.pay != null ? String(Number(r.pay).toFixed(2)) : "",
                      leaflets: r.leaflet_share != null ? String(r.leaflet_share) : "",
                      area: r.area_note || "",
                      start: toDateInput(r.start_date),
                      due: toDateInput(r.due_date),
                      minHours: r.min_hours || "",
                    });
                    setEditSpec(parseSpec(r.boundary));
                    setEditCenter(null);
                  }}
                  className="text-[13px] font-semibold text-orchid transition hover:text-white">
                  {editing === r.id ? "Close map" : specHasDrawing(parseSpec(r.boundary)) ? "Edit area" : "Draw area"}
                </button>
                <button onClick={() => del("assignment", r.id)} className="text-[13px] text-white/30 transition hover:text-rose-300">Remove</button>
              </div>

              {editing === r.id && (
                <div className="w-full border-t border-white/10 pt-3">
                  {/*
                    Everything this sub-contract commits someone to, in one
                    place. Handing it to a different worker puts it straight
                    into their portal as work to accept; whatever the last one
                    signed stops applying, so it goes back to awaiting
                    acceptance rather than looking agreed by someone who never
                    saw it.
                  */}
                  <div className="mb-3 grid gap-3 sm:grid-cols-3">
                    <label className="block sm:col-span-1">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Assigned to</span>
                      <select className={input} value={ed.who} onChange={(e) => setEd({ ...ed, who: e.target.value })}>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">
                        What {nameOf(Number(ed.who) || r.user_id)} sees this job called
                      </span>
                      <input className={input} value={ed.title} placeholder={ed.area || `Job #${r.job_id}`}
                        onChange={(e) => setEd({ ...ed, title: e.target.value })} />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-emerald-300">Payment $</span>
                      <input className={input} inputMode="decimal" value={ed.pay}
                        onChange={(e) => {
                          ownPayEdit.current = true;
                          setEd({ ...ed, pay: e.target.value.replace(/[^0-9.]/g, "") });
                        }} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Leaflets</span>
                      <input className={input} inputMode="numeric" value={ed.leaflets}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, "");
                          const n = Number(v) || 0;
                          setEd((p) => ({
                            ...p, leaflets: v,
                            pay: ownPayEdit.current ? p.pay : payFor(n),
                            minHours: ownHoursEdit.current ? p.minHours : minHoursFor(n),
                          }));
                        }} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Their area</span>
                      <input className={input} value={ed.area}
                        onChange={(e) => setEd({ ...ed, area: e.target.value })} />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Start</span>
                      <DateInput className={input} value={ed.start} onChange={(v) => setEd({ ...ed, start: v })} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Due</span>
                      <DateInput className={input} value={ed.due} onChange={(v) => setEd({ ...ed, due: v })} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-[11px] font-semibold text-white/35">Minimum hours</span>
                      <input className={input} placeholder="e.g. 3.5 or 3 hours 30 mins" value={ed.minHours}
                        onChange={(e) => { ownHoursEdit.current = true; setEd({ ...ed, minHours: e.target.value }); }}
                        onBlur={(e) => setEd((p) => ({ ...p, minHours: tidyHours(e.target.value) }))} />
                    </label>
                  </div>

                  {ed.who !== String(r.user_id) && (
                    <p className="mb-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-amber-200">
                      Saving hands this to {nameOf(Number(ed.who))} — it goes to them to accept and sign, and
                      {" "}{nameOf(r.user_id)} loses it.
                    </p>
                  )}
                  {ed.who === String(r.user_id) && ed.pay !== "" && Number(ed.pay).toFixed(2) !== Number(r.pay || 0).toFixed(2) && (
                    <p className="mb-3 rounded-xl border border-amber-400/35 bg-amber-500/10 px-3.5 py-2.5 text-[12px] font-semibold text-amber-200">
                      Changing the pay asks {nameOf(r.user_id)} to read the new amount and sign for it before
                      they carry on.
                    </p>
                  )}

                  <div className="mb-3">
                    <JunkMailToggle value={ed.junk} onChange={(v) => setEd({ ...ed, junk: v })} />
                  </div>

                  <div className="grid gap-3 lg:grid-cols-2">
                    {r.map_image && (
                      <div>
                        <p className="mb-2 text-[12px] text-white/40">
                          {nameOf(r.user_id)}&apos;s diagram — trace the same area on the map beside it.
                        </p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={r.map_image} alt="Area diagram" className="w-full rounded-xl border border-white/12" />
                      </div>
                    )}
                    <div className={r.map_image ? "" : "lg:col-span-2"}>
                      <p className="mb-2 text-[12px] text-white/40">
                        Click to drop boundary points. {nameOf(r.user_id)} gets this as a live map with their own position on it.
                      </p>
                      <BoundaryMap spec={editSpec} center={parseCenter(r.map_center)} editable expandable height={360}
                        onChange={(sp, c) => { setEditSpec(sp); setEditCenter(c); }} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      disabled={saving}
                      onClick={async () => {
                        setSaving(true);
                        // The first drawn point is a good place to open the map next time.
                        const first = editSpec.shapes.find((sh) => sh.length)?.[0];
                        // Send the row back whole — the upsert overwrites what it's given.
                        const ok = await post({
                          entity: "assignment", id: r.id, jobId: job.id,
                          userId: Number(ed.who) || r.user_id,
                          title: ed.title.trim() || null, junkMailAllowed: ed.junk,
                          pay: ed.pay === "" ? null : Number(ed.pay),
                          leafletShare: ed.leaflets === "" ? null : Number(ed.leaflets),
                          areaNote: ed.area.trim() || null,
                          startDate: ed.start || null, dueDate: ed.due || null, status: r.status,
                          minHours: tidyHours(ed.minHours) || null,
                          allocatedTime: spanOf(ed.start, ed.due),
                          boundary: specHasDrawing(editSpec) ? JSON.stringify(editSpec) : null,
                          mapCenter: JSON.stringify(editCenter ?? (first ? [first[0], first[1], 15] : null)),
                        });
                        setSaving(false);
                        if (ok) setEditing(null);
                      }}
                      className={btn}>
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <span className="text-[12px] text-white/35">
                      {!specHasDrawing(editSpec)
                        ? editSpec.mode === "area" ? "Drop at least 3 points to close the area." : "Mark at least 2 points along a road."
                        : `${countPoints(editSpec)} points`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <button onClick={() => setAdding((v) => !v)}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-left transition hover:bg-white/[0.08]">
        <span>
          <span className="block text-[14px] font-bold text-white">
            {rows.length ? "Add another sub-contract" : "Add a sub-contract"}
          </span>
          <span className="mt-0.5 block text-[12px] text-white/45">
            {left > 0 ? `${left.toLocaleString()} leaflets still to share out` : "All leaflets are shared out"}
          </span>
        </span>
        <span className={`shrink-0 text-white/40 transition-transform ${adding ? "rotate-180" : ""}`}>▾</span>
      </button>

      <div className={`mt-3 grid gap-2 sm:grid-cols-6 ${adding ? "" : "hidden"}`}>
        <select className={input} value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
          <option value="">Worker…</option>
          {/* Anyone can take another slice of the same job. */}
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
              {rows.filter((r) => r.user_id === u.id).length
                ? ` (already on ${rows.filter((r) => r.user_id === u.id).length})`
                : ""}
            </option>
          ))}
        </select>
        <input className={input} placeholder="Pay $" inputMode="decimal" value={f.pay}
          onChange={(e) => { ownPay.current = true; setF({ ...f, pay: e.target.value }); }} />
        <input className={input} placeholder={left > 0 ? `Leaflets (${left.toLocaleString()} left)` : "Leaflets"} inputMode="numeric"
          value={f.leafletShare}
          onChange={(e) => {
            const v = e.target.value;
            const n = Number(v) || 0;
            setF((p) => ({
              ...p, leafletShare: v,
              pay: ownPay.current ? p.pay : payFor(n),
              minHours: ownHours.current ? p.minHours : minHoursFor(n),
            }));
          }} />
        <input className={input} placeholder="Their area" value={f.areaNote} onChange={(e) => setF({ ...f, areaNote: e.target.value })} />
        <input className={input} placeholder="What they'll see this called" value={f.title}
          onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="sm:col-span-2">
          <JunkMailToggle value={f.junkMailAllowed} onChange={(v) => setF({ ...f, junkMailAllowed: v })} />
        </div>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Start</span>
          <DateInput className={input} value={f.startDate} onChange={(v) => setF({ ...f, startDate: v })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Due</span>
          <DateInput className={input} value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Min hours</span>
          <input className={input} placeholder="e.g. 3.5 or 3 hours 30 mins" value={f.minHours}
            onChange={(e) => { ownHours.current = true; setF({ ...f, minHours: e.target.value }); }}
            onBlur={(e) => setF((p) => ({ ...p, minHours: tidyHours(e.target.value) }))} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Allocated time</span>
          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[13px] text-white/45">
            {spanOf(f.startDate, f.dueDate)}
          </p>
        </label>
        <div className="block sm:col-span-2">
          <ImageDrop value={f.mapImage} onChange={(v) => setF({ ...f, mapImage: v })}
            label="Area diagram (optional)"
            hint="Paste a Google Maps screenshot — then trace it below to turn it into a live map." />
        </div>

        <div className="sm:col-span-6">
          <button type="button" onClick={() => setTracing((v) => !v)}
            className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white">
            {tracing ? "Hide map" : countPoints(traceSpec) ? `This worker's area (${countPoints(traceSpec)} points)` : "Draw this worker's area on the map"}
          </button>
        </div>

        {tracing && (
          <div className="sm:col-span-6 grid gap-3 lg:grid-cols-2">
            {f.mapImage && (
              <div>
                <p className="mb-2 text-[12px] text-white/40">Your diagram — trace the same area on the map beside it.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.mapImage} alt="Area diagram reference" className="w-full rounded-xl border border-white/12" />
              </div>
            )}
            <div className={f.mapImage ? "" : "lg:col-span-2"}>
              <p className="mb-2 text-[12px] text-white/40">
                Click to drop boundary points. The worker gets this as a live map they can zoom, with their own position on it.
              </p>
              <BoundaryMap spec={traceSpec} editable expandable height={380}
                onChange={(sp, c) => setF((prev) => ({ ...prev, boundary: JSON.stringify(sp), mapCenter: JSON.stringify(c) }))} />
            </div>
          </div>
        )}


        <div className="sm:col-span-6">
          <ActionButton className={btn} disabled={!f.userId} busyLabel="Adding…"
            onClick={async () => { if (await post({ entity: "assignment", jobId: job.id, ...f, allocatedTime: spanOf(f.startDate, f.dueDate) })) { setF(blank); setAdding(false); setTracing(false); } }}>
            Add sub-contract
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
