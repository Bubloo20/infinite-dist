"use client";

import { useMemo, useState } from "react";
import { GlassCard } from "./PortalShell";
import BoundaryMap, { type LatLng } from "./BoundaryMap";
import type { Agency, ClientJob, PortalUser, JobInterest, JobAssignment } from "@/lib/portal/db";

const input =
  "w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08] [color-scheme:dark]";
const btn =
  "rounded-xl bg-gradient-to-r from-electric to-orchid px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_-14px_rgba(182,109,199,0.9)] transition hover:-translate-y-0.5 disabled:opacity-40";
const btnGhost =
  "rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:bg-white/[0.1] hover:text-white";

const parsePts = (s: string | null): LatLng[] => {
  if (!s) return [];
  try { const v = JSON.parse(s); return Array.isArray(v) ? v : []; } catch { return []; }
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
  const [pts, setPts] = useState<LatLng[]>([]);
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
    setPts(parsePts(j?.boundary ?? null));
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
      boundary: pts.length >= 3 ? JSON.stringify(pts) : null,
      mapCenter: center ? JSON.stringify(center) : job.map_center,
      published: mode === "market",
      assignedUserId: mode === "assign" ? assignTo || null : null,
    });
    if (ok) { setJobId(""); setPts([]); setShowMap(false); setF({ workerPay: "", allocatedTime: "", minHours: "" }); }
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
                <input className={input} placeholder="e.g. 6" value={f.minHours} onChange={(e) => setF({ ...f, minHours: e.target.value })} />
              </label>

              <div className="sm:col-span-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setShowMap((v) => !v)} className={btnGhost}>
                  {showMap ? "Hide map" : pts.length ? `Delivery area (${pts.length} points)` : "Draw delivery area"}
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
                  <BoundaryMap boundary={pts} editable height={420} onChange={(p, c) => { setPts(p); setCenter(c); }} />
                </div>
              )}

              <div className="sm:col-span-3">
                <button className={btn} onClick={publish} disabled={mode === "assign" && !assignTo}>
                  {mode === "assign" ? "Assign to worker" : "Publish to marketplace"}
                </button>
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
export function SubContracts({ job, users, rows, post, del }: {
  job: ClientJob; users: PortalUser[]; rows: JobAssignment[];
  post: (body: Record<string, unknown>) => Promise<boolean>;
  del: (entity: string, id: number) => Promise<void>;
}) {
  const blank = {
    userId: "", pay: "", leafletShare: "", areaNote: "",
    startDate: "", dueDate: "", minHours: "", allocatedTime: "", mapImage: "",
  };
  const [f, setF] = useState(blank);
  const [imgErr, setImgErr] = useState("");

  /** Area diagrams are stored inline, so keep them small. */
  const readImage = (file: File | undefined) => {
    setImgErr("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setImgErr("That file isn't an image."); return; }
    if (file.size > 1_500_000) { setImgErr("Image is over 1.5MB — please shrink it first."); return; }
    const fr = new FileReader();
    fr.onload = () => setF((p) => ({ ...p, mapImage: String(fr.result || "") }));
    fr.readAsDataURL(file);
  };

  const nameOf = (id: number) => users.find((u) => u.id === id)?.full_name || `User ${id}`;
  const shortDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "short" }) : null;

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
            : "Split this job between several workers, each on their own pay and dates."}
        </p>
      </div>

      {rows.length > 0 && (
        <div className="mt-4 space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
              <div>
                <p className="font-semibold text-white">{nameOf(r.user_id)}</p>
                <p className="text-[13px] text-white/45">
                  {r.leaflet_share ? `${r.leaflet_share.toLocaleString()} leaflets` : "share not set"}
                  {r.area_note ? ` · ${r.area_note}` : ""}
                  {shortDate(r.start_date) ? ` · starts ${shortDate(r.start_date)}` : ""}
                  {shortDate(r.due_date) ? ` · due ${shortDate(r.due_date)}` : ""}
                </p>
                <p className="text-[13px] text-white/35">
                  {r.min_hours ? `min ${r.min_hours} hrs` : "no minimum set"}
                  {r.allocated_time ? ` · ${r.allocated_time}` : ""}
                  {r.map_image ? " · area diagram attached" : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-display text-lg font-extrabold text-emerald-300">${Number(r.pay || 0).toFixed(2)}</span>
                <button onClick={() => del("assignment", r.id)} className="text-[13px] text-white/30 transition hover:text-rose-300">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-6">
        <select className={input} value={f.userId} onChange={(e) => setF({ ...f, userId: e.target.value })}>
          <option value="">Worker…</option>
          {users.filter((u) => !rows.some((r) => r.user_id === u.id)).map((u) => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </select>
        <input className={input} placeholder="Pay $" inputMode="decimal" value={f.pay} onChange={(e) => setF({ ...f, pay: e.target.value })} />
        <input className={input} placeholder={left > 0 ? `Leaflets (${left.toLocaleString()} left)` : "Leaflets"} inputMode="numeric"
          value={f.leafletShare} onChange={(e) => setF({ ...f, leafletShare: e.target.value })} />
        <input className={input} placeholder="Their area" value={f.areaNote} onChange={(e) => setF({ ...f, areaNote: e.target.value })} />
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Start</span>
          <input className={input} type="date" value={f.startDate} onChange={(e) => setF({ ...f, startDate: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Due</span>
          <input className={input} type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Min hours</span>
          <input className={input} placeholder="e.g. 6" value={f.minHours} onChange={(e) => setF({ ...f, minHours: e.target.value })} />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Allocated time</span>
          <input className={input} placeholder="e.g. 3 days" value={f.allocatedTime} onChange={(e) => setF({ ...f, allocatedTime: e.target.value })} />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1 block text-[11px] font-semibold text-white/35">Area diagram (image, optional)</span>
          <input type="file" accept="image/*" onChange={(e) => readImage(e.target.files?.[0])}
            className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-3 py-2 text-[13px] text-white/70 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white" />
        </label>
        {f.mapImage && (
          <div className="sm:col-span-6 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.mapImage} alt="Area diagram preview" className="h-24 rounded-lg border border-white/12 object-contain" />
            <button type="button" onClick={() => setF({ ...f, mapImage: "" })} className="text-[13px] text-white/40 hover:text-rose-300">Remove image</button>
          </div>
        )}
        {imgErr && <p className="sm:col-span-6 text-[13px] text-rose-300">{imgErr}</p>}

        <div className="sm:col-span-6">
          <button className={btn} disabled={!f.userId}
            onClick={async () => { if (await post({ entity: "assignment", jobId: job.id, ...f })) setF(blank); }}>
            Add sub-contract
          </button>
        </div>
      </div>
    </div>
  );
}
