"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import InvoiceSheet, { invoiceTotal, money, type InvoiceLine } from "@/components/portal/InvoiceSheet";
import { elementToPdf, invoiceFileName } from "@/lib/invoicePdf";

const iso = (d: Date) => d.toISOString().slice(0, 10);

const BLANK_LINE: InvoiceLine = { description: "", period: "", quantity: null, rate: null };

type Draft = {
  company: string; attn: string; email: string; address: string;
  invoiceNo: string; invoiceDate: string; lines: InvoiceLine[];
};

const EMPTY: Draft = {
  company: "", attn: "", email: "", address: "",
  invoiceNo: "", invoiceDate: "", lines: [{ ...BLANK_LINE }],
};

const STORE = "infinite.invoice.draft";

const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] text-ink outline-none transition focus:border-ink/50";

/** A number field that stays empty rather than showing a 0 nobody typed. */
function NumberCell({ value, onChange, placeholder, step }: {
  value: number | null;
  onChange: (v: number | null) => void;
  placeholder: string;
  step?: string;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      min="0"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className={input}
    />
  );
}

/**
 * An invoice typed by hand.
 *
 * For work that never went through a job — a one-off, a correction, something
 * billed outside the usual run. The letterhead, ABN, bank details and logo are
 * already on it; what gets typed is who it is for and what they are being
 * charged. Totals are never typed, so the arithmetic on an invoice going to an
 * agency cannot be wrong.
 */
export default function NewInvoicePage() {
  const [d, setD] = useState<Draft>(EMPTY);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  // Kept across a refresh. Half a typed invoice is worth more than a clean slate.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Draft>;
        setD({ ...EMPTY, ...saved, lines: saved.lines?.length ? saved.lines : [{ ...BLANK_LINE }] });
      } else {
        setD({ ...EMPTY, invoiceDate: iso(new Date()) });
      }
    } catch {
      setD({ ...EMPTY, invoiceDate: iso(new Date()) });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORE, JSON.stringify(d)); } catch { /* private window */ }
  }, [d, ready]);

  const fileName = invoiceFileName(d.company, d.invoiceDate || null);

  // The browser's "Save as PDF" takes its file name from the page title.
  useEffect(() => {
    const was = document.title;
    document.title = fileName.replace(/\.pdf$/, "");
    return () => { document.title = was; };
  }, [fileName]);

  const setLine = (i: number, patch: Partial<InvoiceLine>) =>
    setD((p) => ({ ...p, lines: p.lines.map((l, n) => (n === i ? { ...l, ...patch } : l)) }));

  const total = invoiceTotal(d.lines);

  if (!ready) return <div className="grid min-h-screen place-items-center bg-white text-ink">Loading…</div>;

  return (
    <div className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex max-w-[820px] flex-wrap items-center justify-between gap-3 px-6 print:hidden">
        <Link href="/portal/admin" className="text-sm font-semibold text-slate-600 hover:text-ink">
          ← Back to dashboard
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (!confirm("Clear this invoice and start again?")) return;
              setD({ ...EMPTY, invoiceDate: iso(new Date()), lines: [{ ...BLANK_LINE }] });
            }}
            className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:text-ink"
          >
            Start again
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const sheet = document.getElementById("invoice-sheet");
                if (!sheet) return;
                const blob = await elementToPdf(sheet);
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = fileName;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 10_000);
              } finally {
                setBusy(false);
              }
            }}
            className="rounded-xl border border-ink/15 bg-white px-5 py-3 text-sm font-bold text-ink transition hover:-translate-y-0.5"
          >
            {busy ? "Preparing…" : "Download PDF"}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-ink px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
          >
            Save as PDF / Print
          </button>
        </div>
      </div>

      {/* ------------------------------ the form ------------------------------ */}
      <div className="mx-auto mb-6 max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm print:hidden">
        <p className="font-display text-lg font-extrabold text-ink">Who it&apos;s for</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Company name</span>
            <input className={input} value={d.company} placeholder="Nelson Alexander Kew"
              onChange={(e) => setD({ ...d, company: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Attn (optional)</span>
            <input className={input} value={d.attn} placeholder="Who it goes to"
              onChange={(e) => setD({ ...d, attn: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Their email (optional)</span>
            <input className={input} value={d.email} placeholder="accounts@agency.com.au"
              onChange={(e) => setD({ ...d, email: e.target.value })} />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Their address (optional)</span>
            <input className={input} value={d.address} placeholder="123 High Street, Kew VIC 3101"
              onChange={(e) => setD({ ...d, address: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Invoice number (optional)</span>
            <input className={input} value={d.invoiceNo} placeholder="Leave blank to leave it off"
              onChange={(e) => setD({ ...d, invoiceNo: e.target.value })} />
          </label>
          <label className="block">
            <span className="mb-1 block text-[13px] font-semibold text-ink/55">Invoice date</span>
            <input type="date" className={input} value={d.invoiceDate}
              onChange={(e) => setD({ ...d, invoiceDate: e.target.value })} />
          </label>
        </div>
      </div>

      <div className="mx-auto mb-6 max-w-[820px] rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm print:hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-lg font-extrabold text-ink">What they&apos;re being charged</p>
          <p className="text-[13px] font-semibold text-ink/45">Quantity × rate — the totals add themselves</p>
        </div>

        <div className="mt-4 space-y-4">
          {d.lines.map((l, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[13px] font-semibold text-ink/55">Leaflet type</span>
                  <input className={input} value={l.description} placeholder="Box Hill South leaflets"
                    onChange={(e) => setLine(i, { description: e.target.value })} />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-[13px] font-semibold text-ink/55">Period (day of completion)</span>
                  <input className={input} value={l.period} placeholder="21 October 2026"
                    onChange={(e) => setLine(i, { period: e.target.value })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-ink/55">Quantity</span>
                  <NumberCell value={l.quantity} placeholder="1000" step="1"
                    onChange={(v) => setLine(i, { quantity: v })} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[13px] font-semibold text-ink/55">Rate per leaflet ($)</span>
                  <NumberCell value={l.rate} placeholder="0.14" step="0.001"
                    onChange={(v) => setLine(i, { rate: v })} />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <p className="text-[15px] font-bold text-ink">
                  Line total: ${money((l.quantity || 0) * (l.rate || 0))}
                </p>
                {d.lines.length > 1 && (
                  <button
                    onClick={() => setD({ ...d, lines: d.lines.filter((_, n) => n !== i) })}
                    className="text-[13px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    Remove line
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setD({ ...d, lines: [...d.lines, { ...BLANK_LINE }] })}
            className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-ink transition hover:-translate-y-0.5"
          >
            + Add another line
          </button>
          <p className="font-display text-lg font-extrabold text-ink">Total: ${money(total)}</p>
        </div>
      </div>

      <p className="mx-auto mb-3 max-w-[820px] px-6 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-500 print:hidden">
        Preview — this is what gets sent
      </p>

      <InvoiceSheet
        to={{ company: d.company, attn: d.attn, email: d.email, address: d.address }}
        invoiceNo={d.invoiceNo}
        invoiceDate={d.invoiceDate}
        lines={d.lines}
      />

      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 16mm; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  );
}
