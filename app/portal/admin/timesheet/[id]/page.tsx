"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { parseHours } from "@/lib/portal/text";

type Log = {
  id: number; worker_name: string; started_at: string; ended_at: string;
  time_spent: string | null; leaflet_count: number | null; area_worked: string | null;
  amount: string | null; paid_on: string | null; paid_at: string | null;
  strava_urls: string | null; mapmy_urls: string | null; photos: string | null;
  strava_verified: boolean | null; notes: string | null;
};

type Worker = {
  user_id: number; full_name: string; min_hours: string | null; pay: string | null;
  leaflet_share: number | null; area_note: string | null;
  start_date: string | null; due_date: string | null;
  schedule: string | null; signed_date: string | null;
  logs: Log[];
};

type Data = { ok: boolean; job?: { id: number; title: string | null; job_number: string | null; area: string | null }; workers?: Worker[]; orphans?: Log[]; error?: string };

const hoursBetween = (start?: string, end?: string) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 1440;
  return mins / 60;
};
const fmtHours = (h: number) => {
  const mins = Math.round(h * 60);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return hh ? (mm ? `${hh}h ${mm}m` : `${hh}h`) : `${mm}m`;
};
// Minimums are stored the way they're written — "2 hours 50 mins" as often as
// "2.5" — so read both rather than grabbing the first number.
const minHoursOf = parseHours;
const dayLabel = (k: string) => {
  const d = new Date(`${k}T00:00:00`);
  return Number.isNaN(d.getTime()) ? k : d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
};
const stamp = (l: Log) =>
  l.paid_at
    ? new Date(l.paid_at).toLocaleString("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })
    : l.paid_on
      ? new Date(`${l.paid_on}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
      : "";
const links = (packed: string | null) => {
  if (!packed) return [];
  try { const v = JSON.parse(packed); return Array.isArray(v) ? (v as string[]) : []; } catch { return packed ? [packed] : []; }
};
const actualHours = (l: Log) => {
  const ms = new Date(l.ended_at).getTime() - new Date(l.started_at).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms / 3600000 : 0;
};

/** What each worker on a job agreed to work, next to what they actually logged. */
export default function TimesheetPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/admin/timesheet?jobId=${id}`)
      .then((r) => r.json()).then(setD).catch(() => setD({ ok: false }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;
  if (!d?.ok || !d.job) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-ink">
        <div className="text-center">
          <p>{d?.error || "No timesheet for this job."}</p>
          <Link href="/portal/admin" className="mt-3 inline-block underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const workers = d.workers || [];

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-between px-6 print:hidden">
        <Link href="/portal/admin" className="text-sm font-semibold text-slate-600 hover:text-ink">← Back to dashboard</Link>
        <button onClick={() => window.print()} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
          Save as PDF / Print
        </button>
      </div>

      <div className="mx-auto max-w-[900px] bg-white px-10 py-10 shadow-xl print:max-w-none print:px-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-dark.png" alt="Infinite Distribution" className="mb-7 h-12 w-auto" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Timesheet</h1>
        <p className="mt-1.5 text-[15px] text-ink/70">
          {d.job.title || `Job #${d.job.id}`}
          {d.job.job_number ? ` · ${d.job.job_number}` : ""}
          {d.job.area ? ` · ${d.job.area}` : ""}
        </p>

        {!workers.length && <p className="mt-8 text-ink/60">Nobody is assigned to this job yet.</p>}

        {workers.map((w) => {
          const schedule: Record<string, { start: string; end: string }> = (() => {
            try { return w.schedule ? JSON.parse(w.schedule) : {}; } catch { return {}; }
          })();
          const days = Object.entries(schedule)
            .filter(([, v]) => v?.start || v?.end)
            .sort(([a], [b]) => a.localeCompare(b));
          const agreed = days.reduce((t, [, v]) => t + hoursBetween(v.start, v.end), 0);
          const min = minHoursOf(w.min_hours);
          const worked = w.logs.reduce((t, l) => t + actualHours(l), 0);
          const leaflets = w.logs.reduce((t, l) => t + (l.leaflet_count || 0), 0);

          return (
            <section key={w.user_id} className="mt-9 break-inside-avoid border-t border-slate-200 pt-7 first:border-0">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="font-display text-xl font-bold text-ink">{w.full_name}</h2>
                <p className="text-[13px] text-ink/55">
                  {w.signed_date
                    ? `Signed ${new Date(`${w.signed_date}T00:00:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Agreement not signed yet"}
                </p>
              </div>

              <div className="mt-3 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-[14px] sm:grid-cols-4">
                {[
                  ["Scheduled", days.length ? fmtHours(agreed) : "—"],
                  ["Minimum", min ? fmtHours(min) : "—"],
                  ["Actually worked", w.logs.length ? fmtHours(worked) : "—"],
                  ["Leaflets logged", leaflets ? leaflets.toLocaleString() : "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{k}</p>
                    <p className={`mt-0.5 font-semibold ${
                      k === "Scheduled" && min > 0 && agreed + 1e-9 < min ? "text-amber-600" : "text-ink"}`}>{v}</p>
                  </div>
                ))}
              </div>

              <h3 className="mt-6 text-[13px] font-bold uppercase tracking-wide text-ink/45">Hours they committed to</h3>
              {days.length ? (
                <table className="mt-2 w-full border-collapse text-[14px]">
                  <tbody>
                    {days.map(([day, v]) => (
                      <tr key={day}>
                        <td className="border border-slate-300 px-3 py-1.5 font-semibold">{dayLabel(day)}</td>
                        <td className="border border-slate-300 px-3 py-1.5">Start: {v.start || "—"}</td>
                        <td className="border border-slate-300 px-3 py-1.5">End: {v.end || "—"}</td>
                        <td className="border border-slate-300 px-3 py-1.5 text-right">
                          {hoursBetween(v.start, v.end) ? fmtHours(hoursBetween(v.start, v.end)) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="mt-2 text-[14px] text-ink/50">No schedule submitted.</p>
              )}

              <h3 className="mt-6 text-[13px] font-bold uppercase tracking-wide text-ink/45">Shifts they logged</h3>
              {w.logs.length ? (
                <div className="mt-2 space-y-2">
                  {w.logs.map((l) => (
                    <div key={l.id} className="rounded-xl border border-slate-200 p-3 text-[14px]">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold text-ink">
                          {new Date(l.started_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                          {" → "}
                          {new Date(l.ended_at).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
                        </span>
                        <span className={`rounded-md px-2 py-0.5 text-[12px] font-bold ${
                          l.paid_on ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {l.paid_on ? `Paid ${stamp(l)}` : "Awaiting payment"}
                        </span>
                      </div>
                      <p className="mt-1 text-ink/65">
                        {l.time_spent || fmtHours(actualHours(l))}
                        {l.leaflet_count ? ` · ${l.leaflet_count.toLocaleString()} leaflets` : ""}
                        {l.area_worked ? ` · ${l.area_worked}` : ""}
                        {l.amount ? ` · $${Number(l.amount).toFixed(2)}` : ""}
                        {l.strava_verified ? " · Strava verified" : ""}
                      </p>
                      {[...links(l.strava_urls), ...links(l.mapmy_urls)].length > 0 && (
                        <p className="mt-1 break-all text-[13px] text-ink/50 print:text-ink/70">
                          {[...links(l.strava_urls), ...links(l.mapmy_urls)].map((u) => (
                            <a key={u} href={u} target="_blank" rel="noreferrer" className="mr-3 underline">{u}</a>
                          ))}
                        </p>
                      )}
                      {links(l.photos).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {links(l.photos).map((src, i) => (
                            <a key={i} href={src} target="_blank" rel="noreferrer" className="block">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={src} alt={`Photo ${i + 1}`}
                                className="h-20 w-20 rounded-lg border border-slate-300 object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                      {l.notes && <p className="mt-1 text-[13px] italic text-ink/55">“{l.notes}”</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[14px] text-ink/50">No shifts logged yet.</p>
              )}
            </section>
          );
        })}

        {(d.orphans?.length ?? 0) > 0 && (
          <section className="mt-9 border-t border-slate-200 pt-7">
            <h2 className="font-display text-xl font-bold text-ink">Other shifts on this job</h2>
            <div className="mt-2 space-y-2">
              {d.orphans!.map((l) => (
                <div key={l.id} className="rounded-xl border border-slate-200 p-3 text-[14px]">
                  <span className="font-semibold text-ink">{l.worker_name}</span>
                  <span className="text-ink/65">
                    {" — "}{new Date(l.started_at).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    {l.leaflet_count ? ` · ${l.leaflet_count.toLocaleString()} leaflets` : ""}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style jsx global>{`@media print { @page { size: A4; margin: 14mm; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
