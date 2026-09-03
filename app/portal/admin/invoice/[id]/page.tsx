"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { Agency, Agent, ClientJob } from "@/lib/portal/db";
import { elementToPdf, invoiceFileName } from "@/lib/invoicePdf";

/** Where the draft lands, and the wording that goes with it. */
const DRAFT_TO = "bubloo.mohanrajh@gmail.com";
const DRAFT_BODY = `Hi,

Hope you're doing well.

Please find attached invoice.

Let me know if you have any questions.

Thanks,
Bubloo`;

const money = (v: number) => v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
/**
 * What the agency reads on the invoice line: the suburb the drop covered, not
 * the paper stock. "Pascoe Vale leaflets" says what they paid for.
 */
const leafletLine = (area: string | null, title: string | null) => {
  const where = (area || "").trim();
  if (where) return /leaflet/i.test(where) ? where : `${where} leaflets`;
  return (title || "").trim() || "Leaflet distribution";
};

/**
 * An invoice is dated the day it's raised. Only a date deliberately recorded on
 * the job overrides today — it used to fall back to the completion date, which
 * made every invoice look weeks old.
 */
const dateAu = (d: string | null) =>
  (d ? new Date(d) : new Date()).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<ClientJob | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [agencyAgents, setAgencyAgents] = useState<Agent[]>([]);
  // Every sub-contract on this job, for working out when it actually finishes.
  const [dueDates, setDueDates] = useState<string[]>([]);
  const [sendTo, setSendTo] = useState("");
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    fetch("/api/portal/admin/clients")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setDenied(true); return; }
        const j: ClientJob | undefined = (d.jobs || []).find((x: ClientJob) => String(x.id) === String(id));
        setJob(j || null);
        if (j) {
          setAgency((d.agencies || []).find((a: Agency) => a.id === j.agency_id) || null);
          const all: Agent[] = d.agents || [];
          setAgent(all.find((a) => a.id === j.agent_id) || null);
          setAgencyAgents(all.filter((a) => a.agency_id === j.agency_id));
          if (j.agent_id) setSendTo(String(j.agent_id));
          setDueDates(
            (d.assignments || [])
              .filter((a: { job_id: number; due_date: string | null }) => a.job_id === j.id && a.due_date)
              .map((a: { due_date: string }) => a.due_date),
          );
        }
      })
      .catch(() => setDenied(true))
      .finally(() => setLoading(false));
  }, [id]);

  /**
   * Putting the invoice in front of the agency is what makes it sent — the
   * status used to have to be changed by hand afterwards, and an invoice that
   * had gone out still read "not sent" on the dashboard.
   */
  const markSent = async (j: ClientJob) => {
    if (j.invoice_status !== "not_sent") return;   // already sent, or already paid
    const r = await fetch("/api/portal/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "job", id: j.id,
        agencyId: j.agency_id, agentId: j.agent_id, title: j.title, area: j.area,
        leafletType: j.leaflet_type, quantity: j.quantity, ratePerLeaflet: j.rate_per_leaflet,
        amount: j.amount, status: j.status,
        invoiceStatus: "sent",
        invoiceNo: j.invoice_no, invoiceDate: j.invoice_date,
        pickedOn: j.picked_on, completedOn: j.completed_on, notes: j.notes,
        invoicePeriodOn: j.invoice_period_on,
        jobNumber: j.job_number,
      }),
    });
    const d = await r.json().catch(() => ({ ok: false }));
    if (d.ok) setJob({ ...j, invoice_status: "sent" });
  };

  /** Pin the period this invoice bills for, or clear it to follow the work. */
  const setPeriod = async (j: ClientJob, value: string) => {
    const next = value || null;
    setJob({ ...j, invoice_period_on: next });
    await fetch("/api/portal/admin/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entity: "job", id: j.id,
        agencyId: j.agency_id, agentId: j.agent_id, title: j.title, area: j.area,
        leafletType: j.leaflet_type, quantity: j.quantity, ratePerLeaflet: j.rate_per_leaflet,
        amount: j.amount, status: j.status, invoiceStatus: j.invoice_status,
        invoiceNo: j.invoice_no, invoiceDate: j.invoice_date,
        pickedOn: j.picked_on, completedOn: j.completed_on, notes: j.notes,
        invoicePeriodOn: next,
        jobNumber: j.job_number,
      }),
    });
  };

  if (loading) return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;
  if (denied) return <div className="grid min-h-screen place-items-center bg-white text-ink">Admin sign-in required. <Link href="/portal/admin" className="ml-2 underline">Sign in</Link></div>;
  if (!job) return <div className="grid min-h-screen place-items-center bg-white text-ink">Invoice not found.</div>;

  /**
   * The day the job finishes is the day the last worker on it was due.
   *
   * A job with four sub-contracts running to different dates isn't complete
   * until the last of them is, so that's the period the agency is billed for.
   * The job's own completion date is the fallback for anything with no
   * sub-contracts, which is how the oldest jobs were run.
   */
  const lastDue = dueDates.length
    ? dueDates.reduce((latest, d) => (new Date(d) > new Date(latest) ? d : latest))
    : job.completed_on;
  // Set by hand on this page when the run didn't go the way it was planned.
  const finishedOn = job.invoice_period_on || lastDue;

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

      {/* The invoice as a file, plus a draft waiting in Gmail to attach it to. */}
      <div className="mx-auto mb-4 max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-display text-base font-bold text-ink">Email this to yourself</p>
          {/* So it's obvious the dashboard has been updated too. */}
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
            job.invoice_status === "received" ? "bg-emerald-50 text-emerald-700"
              : job.invoice_status === "sent" ? "bg-sky-50 text-sky-700"
              : "bg-slate-100 text-slate-500"}`}>
            {job.invoice_status === "received" ? "Paid"
              : job.invoice_status === "sent" ? "Marked as sent"
              : "Not sent yet"}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            disabled={drafting}
            onClick={async () => {
              setDrafting(true);
              try {
                const sheet = document.getElementById("invoice-sheet");
                if (!sheet) return;
                // What you download is the sheet above, captured as it appears.
                const blob = await elementToPdf(sheet);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = invoiceFileName(job.invoice_no);
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 10_000);

                const subject = job.invoice_no
                  ? `Letterbox invoice ${job.invoice_no}`
                  : "Letterbox invoice";
                window.open(
                  `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(DRAFT_TO)}` +
                    `&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(DRAFT_BODY)}`,
                  "_blank", "noopener",
                );
                await markSent(job);
              } finally {
                setDrafting(false);
              }
            }}
            className="rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40"
          >
            {drafting ? "Preparing…" : "Download PDF & open draft"}
          </button>
          <span className="text-[13px] text-ink/50">
            Subject: <span className="font-semibold text-ink/70">
              Letterbox invoice{job.invoice_no ? ` ${job.invoice_no}` : ""}
            </span>
          </span>
        </div>
        <p className="mt-2.5 text-[13px] text-ink/50">
          Saves <span className="font-semibold text-ink/70">{invoiceFileName(job.invoice_no)}</span> and opens a Gmail compose to {DRAFT_TO} with the subject and message filled in —
          drag the downloaded file in to attach it, then send it to yourself or forward it on.
        </p>
      </div>

      {/* The period this invoice bills for. */}
      <div className="mx-auto mb-4 max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm print:hidden">
        <p className="font-display text-base font-bold text-ink">Period this invoice covers</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={job.invoice_period_on || ""}
            onChange={(e) => setPeriod(job, e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink"
          />
          {job.invoice_period_on ? (
            <button
              onClick={() => setPeriod(job, "")}
              className="text-[13px] font-semibold text-ink/45 transition hover:text-ink"
            >
              Clear and follow the work
            </button>
          ) : (
            <span className="text-[13px] text-ink/50">
              Following the last worker&apos;s due date — {dateAu(lastDue)}
            </span>
          )}
        </div>
        <p className="mt-2.5 text-[13px] text-ink/50">
          Left empty this is the day the last sub-contract was due, since the job isn&apos;t finished until
          the last one is. Set a date to bill for a different day.
        </p>
      </div>

      {/* Send to an agent — opens Gmail composing from your account. */}
      <div className="mx-auto mb-6 max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm print:hidden">
        <p className="font-display text-base font-bold text-ink">Send this invoice</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <select value={sendTo} onChange={(e) => setSendTo(e.target.value)}
            className="min-w-[240px] flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm text-ink outline-none focus:border-ink">
            <option value="">Choose an agent…</option>
            {agencyAgents.map((a) => (
              <option key={a.id} value={a.id} disabled={!a.email}>
                {a.name}{a.email ? ` — ${a.email}` : " (no email on file)"}
              </option>
            ))}
          </select>
          <button
            disabled={!sendTo || !agencyAgents.find((a) => String(a.id) === sendTo)?.email}
            onClick={async () => {
              const to = agencyAgents.find((a) => String(a.id) === sendTo);
              if (!to?.email) return;
              const invNo = job.invoice_no || "";
              const subject = `Invoice ${invNo} — Infinite Distribution`;
              const body =
                `Hi ${to.name.split(" ")[0]},\n\n` +
                `Please find attached invoice ${invNo} for ${qty ? qty.toLocaleString() : ""} leaflets` +
                `${job.area ? ` in ${job.area}` : ""}${finishedOn ? `, completed ${dateAu(finishedOn)}` : ""}.\n\n` +
                `Total amount due: $${money(total)}\n` +
                `Payment terms: within 1 week of the invoice date.\n\n` +
                `Bank details\nAccount name: Sarvesh Mohanrajh\nBSB: 670 - 864\nAccount No: 3878 5206\n\n` +
                `Thanks,\nSarvesh Mohanrajh\nInfinite Distribution\nABN 66 177 274 211\n0421 042 007`;
              window.open(
                `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
                "_blank", "noopener",
              );
              await markSent(job);
            }}
            className="rounded-xl bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            Compose in Gmail
          </button>
        </div>
        <p className="mt-2.5 text-[13px] text-ink/50">
          Opens Gmail with the agent, subject and details filled in, sent from whichever account you&apos;re signed into.
          Save the PDF above first and attach it. Agent emails come from the Agents tab.
        </p>
      </div>

      {/* The sheet itself — also what the PDF download captures. */}
      <div id="invoice-sheet" className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:py-0 print:shadow-none">
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
            {/* The number is optional — with none set, the line comes off entirely. */}
            {job.invoice_no && (
              <p>Invoice No: <span className="font-semibold">{job.invoice_no}</span></p>
            )}
            <p>Invoice Date: <span className="font-semibold">{dateAu(job.invoice_date) }</span></p>
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
              <td className="border border-slate-300 px-3 py-3">{leafletLine(job.area, job.title)}</td>
              <td className="border border-slate-300 px-3 py-3">{dateAu(finishedOn)}</td>
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
