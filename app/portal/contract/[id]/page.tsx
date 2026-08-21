"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CONTRACT_TERMS, junkMailTerm } from "@/components/portal/JobContract";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";
import { tidyHours, clockLabel } from "@/lib/portal/text";

const dateAu = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }) : "____________________";

/** Schedule keys are ISO dates; show them as "Monday 11 August". */
const scheduleDay = (k: string) => {
  const d = new Date(`${k}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? k
    : d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
};

/**
 * The agreement as the worker reads it, and their signed copy once they've signed it — the Word document's fields filled in
 * from what the office entered, printable to PDF.
 */
export default function WorkerContractPage() {
  const { id } = useParams<{ id: string }>();
  // Which sub-contract this copy is for — a worker can hold several on one job.
  const assignmentId = useSearchParams().get("a");
  const [job, setJob] = useState<ClientJob | null>(null);
  const [mine, setMine] = useState<JobAssignment | null>(null);
  const [who, setWho] = useState<string>("");
  const [signed, setSigned] = useState<{ signedName: string; signaturePng: string; signedDate: string; schedule: string | null } | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  // No signature file in place yet — fall back to a signing line.
  const [repMissing, setRepMissing] = useState(false);
  // The office's signature is stored rather than shipped, so it can be changed
  // without a deploy. The file in public/ is the fallback for older setups, and
  // nothing is drawn until we know which one we have — otherwise the file's 404
  // marks it missing a moment before the stored one arrives.
  const [repSig, setRepSig] = useState<string | null>(null);
  const [repChecked, setRepChecked] = useState(false);

  useEffect(() => {
    fetch("/api/portal/admin/settings")
      .then((r) => r.json())
      .then((d) => setRepSig(d?.signature ?? null))
      .catch(() => setRepSig(null))
      .finally(() => setRepChecked(true));
  }, []);

  useEffect(() => {
    fetch(`/api/portal/me/contract?jobId=${id}${assignmentId ? `&assignmentId=${assignmentId}` : ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setState("error"); return; }
        setJob(d.job); setMine(d.assignment); setWho(d.workerName || ""); setSigned(d.contract || null);
        setState("ok");
        // Mark it read so the portal can unlock signing.
        try { localStorage.setItem(`idp_contract_seen_${id}`, "1"); } catch { /* private mode */ }
      })
      .catch(() => setState("error"));
  }, [id, assignmentId]);

  if (state === "loading") return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;
  if (state === "error" || !job) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-ink">
        <div className="text-center">
          <p>This agreement isn&apos;t available.</p>
          <Link href="/portal" className="mt-3 inline-block underline">Back to your portal</Link>
        </div>
      </div>
    );
  }

  // An agreement covers this worker's slice. Where there IS a sub-contract its
  // figures are the whole story — falling through to the job's totals put the
  // entire run on one person's contract.
  const solo = !mine;
  const pay = mine ? mine.pay : job.worker_pay;
  const leaflets = mine ? mine.leaflet_share : job.quantity;
  const allocated = mine?.start_date || mine?.due_date
    ? `${dateAu(mine?.start_date)} to ${dateAu(mine?.due_date)}`
    : mine?.allocated_time || (solo ? job.allocated_time : null) || "____________________";

  // The day this agreement was drawn up for them.
  const drawnUp = (mine?.created_at || "").slice(0, 10) || new Date().toISOString().slice(0, 10);

  const signedSchedule: Record<string, { start: string; end: string }> = (() => {
    try { return signed?.schedule ? JSON.parse(signed.schedule) : {}; } catch { return {}; }
  })();
  const signedDays = Object.entries(signedSchedule)
    .filter(([, v]) => v?.start || v?.end)
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <Link href={`/portal/job/${assignmentId ?? id}`} className="text-sm font-semibold text-slate-600 hover:text-ink">← Back to sign this job</Link>
        <button onClick={() => window.print()} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
          Save as PDF / Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-dark.png" alt="Infinite Distribution" className="mb-8 h-14 w-auto" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Independent Contractor Agreement</h1>
        {signed && (
          <p className="mt-3 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-[13px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            Signed by you on {dateAu(signed.signedDate)} — this is your copy
          </p>
        )}

        <div className="mt-6 space-y-1.5 text-[15px] text-ink/85">
          <p><span className="font-semibold">Business Name:</span> Sarvesh Mohanrajh (operating under Infinite Distribution)</p>
          <p><span className="font-semibold">ABN:</span> 66 177 274 211</p>
          <p><span className="font-semibold">Contractor Name:</span> {who || "____________________"}</p>
          <p><span className="font-semibold">Job area:</span> {mine ? mine.area_note || "____________________" : job.area || "____________________"}</p>
          <p><span className="font-semibold">Leaflet Amount:</span> {leaflets ? leaflets.toLocaleString() : "____________________"}</p>
          <p><span className="font-semibold">Allocated time:</span> {allocated}</p>
          <p><span className="font-semibold">Payment Amount:</span> {pay ? `$${Number(pay).toFixed(2)}` : "$____________"}</p>
          <p><span className="font-semibold">Minimum Hours of work:</span> {tidyHours(mine ? mine.min_hours : job.min_hours) || "____________________"}</p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Terms</h2>
        <ul className="mt-3 space-y-2">
          {/* This job's own rule first — it changes how the street is walked. */}
          <li className="font-semibold text-ink">{junkMailTerm(Boolean(mine?.junk_mail_allowed))}</li>
          {CONTRACT_TERMS.map((t, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink/80">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/50" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        {signedDays.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-xl font-bold text-ink">Agreed schedule</h2>
            <table className="mt-3 w-full border-collapse text-[14px]">
              <tbody>
                {signedDays.map(([day, v]) => (
                  <tr key={day}>
                    <td className="border border-slate-300 px-3 py-2 font-semibold">{scheduleDay(day)}</td>
                    <td className="border border-slate-300 px-3 py-2">Start: {clockLabel(v.start) || "—"}</td>
                    <td className="border border-slate-300 px-3 py-2">End: {clockLabel(v.end) || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Signatures</h2>
        <div className="mt-3 grid gap-8 text-[15px] text-ink/85 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">Contractor</p>
            {signed ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={signed.signaturePng} alt="Your signature"
                  className="mt-2 h-24 w-full rounded border border-slate-300 bg-slate-900 object-contain p-2" />
                <p className="mt-2 font-semibold text-ink">{signed.signedName}</p>
                <p className="text-[14px] text-ink/70">Date: {dateAu(signed.signedDate)}</p>
              </>
            ) : (
              <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 print:bg-white">
                <p className="text-[15px] font-semibold text-ink">Not signed yet</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink/70">
                  Go back to your portal to sign this electronically — your signature and the date are
                  recorded there and a signed copy comes straight to the office.
                </p>
                <Link href={`/portal/job/${assignmentId ?? id}`} className="mt-2 inline-block text-[14px] font-bold text-[#5b21b6] underline">
                  Go back and sign this job
                </Link>
              </div>
            )}
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">
              Infinite Distribution representative
            </p>
            {!repChecked ? (
              <div className="mt-2 h-24" />
            ) : repMissing ? (
              <div className="mt-2 flex h-24 items-end">
                <span className="w-full border-b border-slate-400 pb-1 text-[13px] text-ink/40 print:text-ink/60">
                  Signature
                </span>
              </div>
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img key={repSig || "file"} src={repSig || "/images/signature.png"} alt="Sarvesh Mohanrajh"
                className="mt-2 h-24 w-full object-contain object-left"
                onError={() => setRepMissing(true)} />
            )}
            <p className="mt-1 font-semibold text-ink">Sarvesh Mohanrajh</p>
            <p className="text-[14px] text-ink/70">Date: {dateAu(drawnUp)}</p>
          </div>
        </div>
        <p className="mt-6 text-[13px] text-ink/50">
          {signed
            ? "Signed electronically through the Infinite Distribution team portal. This is your copy — you can open it from your portal at any time."
            : "Sign this agreement electronically in your portal — your signature and the date are recorded there and a signed copy is sent to the office."}
        </p>
      </div>

      <style jsx global>{`@media print { @page { size: A4; margin: 14mm; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
