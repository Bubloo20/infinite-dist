"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Agency, Agent, ClientJob } from "@/lib/portal/db";

const money = (v: number) => v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dateAu = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" }) : "—";

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ClientJob | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    fetch("/api/portal/admin/clients")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setDenied(true); return; }
        const j: ClientJob | undefined = (d.jobs || []).find((x: ClientJob) => String(x.id) === String(id));
        setJob(j || null);
        if (j) {
          setAgency((d.agencies || []).find((a: Agency) => a.id === j.agency_id) || null);
          setAgent((d.agents || []).find((a: Agent) => a.id === j.agent_id) || null);
        }
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;
  if (denied) return <div className="grid min-h-screen place-items-center bg-white text-ink">Admin sign-in required. <Link href="/portal/admin" className="ml-2 underline">Sign in</Link></div>;
  if (!job) return <div className="grid min-h-screen place-items-center bg-white text-ink">Invoice not found.</div>;

  const qty = job.quantity ?? 0;
  const rate = job.rate_per_leaflet ? Number(job.rate_per_leaflet) : 0;
  const total = job.amount ? Number(job.amount) : qty * rate;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* Toolbar — hidden when printing */}
      <div className="mx-auto mb-6 flex max-w-[820px] items-center justify-between px-6 print:hidden">
        <Link href="/portal/admin" className="text-sm font-semibold text-slate-600 hover:text-ink">← Back to dashboard</Link>
        <button
          onClick={() => window.print()}
          className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
        >
          Save as PDF / Print
        </button>
      </div>

      <div className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:py-0 print:shadow-none">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo-dark.png" alt="Infinite Distribution" className="mb-8 h-16 w-auto" />

        <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink">INVOICE</h1>
        <div className="mt-3 space-y-0.5 text-[15px] text-ink/80">
          <p>ABN: 66 177 274 211</p>
          <p>Email: bubloo.mohanrajh@gmail.com</p>
          <p>Phone: 0421 042 007</p>
        </div>

        <hr className="my-7 border-t-2 border-ink/25" />

        <div className="flex flex-wrap justify-between gap-6">
          <div className="text-[15px] text-ink/85">
            <p className="font-bold text-ink">Invoice To:</p>
            <p className="mt-1">Company name: <span className="font-semibold">{agency?.name || "—"}</span></p>
            {agent && <p>Attn: <span className="font-semibold">{agent.name}</span></p>}
            {agency?.email && <p>{agency.email}</p>}
            {agency?.address && <p>{agency.address}</p>}
          </div>
          <div className="text-[15px] text-ink/85">
            <p>Invoice No: <span className="font-semibold">{job.invoice_no || `00${job.id}`}</span></p>
            <p>Invoice Date: <span className="font-semibold">{dateAu(job.invoice_date || job.completed_on)}</span></p>
          </div>
        </div>

        <table className="mt-9 w-full border-collapse text-[15px]">
          <thead>
            <tr className="bg-slate-100">
              {["Leaflet type", "Period (Day of completion)", "Quantity", "Rate per leaflet ($)", "Total ($)"].map((h) => (
                <th key={h} className="border border-slate-300 px-3 py-2.5 text-left font-bold text-ink">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 px-3 py-3">{job.leaflet_type || job.title || "Leaflet distribution"}</td>
              <td className="border border-slate-300 px-3 py-3">{dateAu(job.completed_on)}</td>
              <td className="border border-slate-300 px-3 py-3">{qty ? qty.toLocaleString("en-AU") : "—"}</td>
              <td className="border border-slate-300 px-3 py-3">{rate ? rate.toFixed(2) : "—"}</td>
              <td className="border border-slate-300 px-3 py-3 font-semibold">{money(total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-8">
          <p className="font-bold text-ink">Payment Details</p>
          <p className="mt-2 text-lg font-extrabold text-ink">Total Amount Due: ${money(total)}</p>
          <p className="mt-1 text-[15px] text-ink/70">Please pay within 1 week of invoice date</p>
        </div>

        <hr className="my-7 border-t-2 border-ink/25" />

        <div className="text-[15px] text-ink/85">
          <p className="font-bold text-ink">Bank Details</p>
          <p className="mt-1">Account name: Sarvesh Mohanrajh</p>
          <p>BSB: 670 - 864</p>
          <p>Account No: 3878 5206</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
