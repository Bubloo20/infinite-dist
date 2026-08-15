"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CONTRACT_TERMS } from "@/components/portal/JobContract";

type Data = {
  ok: boolean;
  job?: { id: number; title: string | null; area: string | null; quantity: number | null;
          worker_pay: string | null; allocated_time: string | null; min_hours: string | null };
  contract?: { signed_name: string; signature_png: string; signed_date: string; schedule: string | null };
  worker?: string | null;
};

const dateAu = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }) : "—";

/** Schedule keys are ISO dates; show them as "Monday 11 August". */
const scheduleDay = (k: string) => {
  const d = new Date(`${k}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? k
    : d.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" });
};

export default function SignedContractPage() {
  const { id } = useParams<{ id: string }>();
  const [d, setD] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/portal/admin/contract?jobId=${id}`)
      .then((r) => r.json()).then(setD).catch(() => setD({ ok: false }))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;
  if (!d?.ok || !d.contract || !d.job) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-ink">
        <div className="text-center">
          <p>No signed contract found for this job.</p>
          <Link href="/portal/admin" className="mt-3 inline-block underline">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const schedule: Record<string, { start: string; end: string }> = (() => {
    try { return d.contract!.schedule ? JSON.parse(d.contract!.schedule) : {}; } catch { return {}; }
  })();
  const days = Object.entries(schedule).filter(([, v]) => v?.start || v?.end).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <Link href="/portal/admin" className="text-sm font-semibold text-slate-600 hover:text-ink">← Back to dashboard</Link>
        <button onClick={() => window.print()} className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5">
          Save as PDF / Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-dark.png" alt="Infinite Distribution" className="mb-8 h-14 w-auto" />
        <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink">Independent Contractor Agreement</h1>
        <p className="mt-2 text-[15px] text-ink/70">Sarvesh Mohanrajh, operating under Infinite Distribution · ABN 66 177 274 211</p>

        <div className="mt-7 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
          {[
            ["Contractor", d.worker || d.contract.signed_name],
            ["Job area", d.job.area || "—"],
            ["Leaflet amount", d.job.quantity ? d.job.quantity.toLocaleString() : "—"],
            ["Allocated time", d.job.allocated_time || "—"],
            ["Payment amount", d.job.worker_pay ? `$${Number(d.job.worker_pay).toFixed(2)}` : "—"],
            ["Minimum hours of work", d.job.min_hours || "—"],
          ].map(([k, v]) => (
            <div key={k}>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink/45">{k}</p>
              <p className="mt-0.5 font-semibold text-ink">{v}</p>
            </div>
          ))}
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

        {days.length > 0 && (
          <>
            <h2 className="mt-8 font-display text-xl font-bold text-ink">Agreed schedule</h2>
            <table className="mt-3 w-full border-collapse text-[14px]">
              <tbody>
                {days.map(([day, v]) => (
                  <tr key={day}>
                    <td className="border border-slate-300 px-3 py-2 font-semibold">{scheduleDay(day)}</td>
                    <td className="border border-slate-300 px-3 py-2">Start: {v.start || "—"}</td>
                    <td className="border border-slate-300 px-3 py-2">End: {v.end || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">Contractor signature</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.contract.signature_png} alt="Contractor signature"
              className="mt-2 h-24 w-full rounded border border-slate-300 bg-slate-900 object-contain p-2" />
            <p className="mt-2 font-semibold text-ink">{d.contract.signed_name}</p>
            <p className="text-[14px] text-ink/70">Date: {dateAu(d.contract.signed_date)}</p>
          </div>
          <div>
            <p className="text-[13px] font-bold uppercase tracking-wide text-ink/50">Infinite Distribution representative</p>
            <div className="mt-2 h-24 rounded border border-dashed border-slate-300" />
            <p className="mt-2 text-[14px] text-ink/70">Date: ____________________</p>
          </div>
        </div>

        <p className="mt-8 border-t border-slate-200 pt-5 text-[12px] leading-relaxed text-ink/50">
          Signed electronically through the Infinite Distribution team portal. By signing, the contractor confirmed they had read and
          agreed to these terms and that they are engaged as an independent subcontractor, not an employee.
        </p>
      </div>

      <style jsx global>{`@media print { @page { size: A4; margin: 14mm; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
