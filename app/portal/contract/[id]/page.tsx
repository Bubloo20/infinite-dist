"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CONTRACT_TERMS } from "@/components/portal/JobContract";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

const dateAu = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }) : "____________________";

/**
 * The agreement as the worker reads it — the Word document's fields filled in
 * from what the office entered, printable to PDF.
 */
export default function WorkerContractPage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ClientJob | null>(null);
  const [mine, setMine] = useState<JobAssignment | null>(null);
  const [who, setWho] = useState<string>("");
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    fetch(`/api/portal/me/contract?jobId=${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setState("error"); return; }
        setJob(d.job); setMine(d.assignment); setWho(d.workerName || "");
        setState("ok");
        // Mark it read so the portal can unlock signing.
        try { localStorage.setItem(`idp_contract_seen_${id}`, "1"); } catch { /* private mode */ }
      })
      .catch(() => setState("error"));
  }, [id]);

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

  const pay = mine?.pay ?? job.worker_pay;
  const leaflets = mine?.leaflet_share ?? job.quantity;
  const allocated = mine?.start_date || mine?.due_date
    ? `${dateAu(mine?.start_date)} to ${dateAu(mine?.due_date)}`
    : mine?.allocated_time || job.allocated_time || "____________________";

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <Link href="/portal" className="text-sm font-semibold text-slate-600 hover:text-ink">← Back to your portal</Link>
        <button onClick={() => window.print()} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
          Save as PDF / Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-dark.png" alt="Infinite Distribution" className="mb-8 h-14 w-auto" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Independent Contractor Agreement</h1>

        <div className="mt-6 space-y-1.5 text-[15px] text-ink/85">
          <p><span className="font-semibold">Business Name:</span> Sarvesh Mohanrajh (operating under Infinite Distributions)</p>
          <p><span className="font-semibold">ABN:</span> 66 177 274 211</p>
          <p><span className="font-semibold">Contractor Name:</span> {who || "____________________"}</p>
          <p><span className="font-semibold">Job area:</span> {mine?.area_note || job.area || "____________________"}</p>
          <p><span className="font-semibold">Leaflet Amount:</span> {leaflets ? leaflets.toLocaleString() : "____________________"}</p>
          <p><span className="font-semibold">Allocated time:</span> {allocated}</p>
          <p><span className="font-semibold">Payment Amount:</span> {pay ? `$${Number(pay).toFixed(2)}` : "$____________"}</p>
          <p><span className="font-semibold">Minimum Hours of work:</span> {mine?.min_hours || job.min_hours || "____________________"}</p>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Terms</h2>
        <ul className="mt-3 space-y-2">
          {CONTRACT_TERMS.map((t, i) => (
            <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink/80">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink/50" />
              <span>{t}</span>
            </li>
          ))}
        </ul>

        <h2 className="mt-8 font-display text-xl font-bold text-ink">Signatures</h2>
        <div className="mt-3 grid gap-8 text-[15px] text-ink/85 sm:grid-cols-2">
          <div>
            <p>Contractor Signature: ______________________</p>
            <p className="mt-3">Date: ____________________</p>
          </div>
          <div>
            <p>Infinite Distributions Representative: ______________________</p>
            <p className="mt-3">Date: ____________________</p>
          </div>
        </div>
        <p className="mt-6 text-[13px] text-ink/50">
          Sign this agreement electronically in your portal — your signature and the date are recorded there and a signed copy is sent to the office.
        </p>
      </div>

      <style jsx global>{`@media print { @page { size: A4; margin: 14mm; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
