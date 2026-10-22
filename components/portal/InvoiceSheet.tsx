"use client";

/** One billed line. The total is never typed — it is quantity times rate. */
export type InvoiceLine = {
  description: string;
  period: string;
  quantity: number | null;
  rate: number | null;
};

export type InvoiceSheetProps = {
  to: { company: string; attn?: string | null; email?: string | null; address?: string | null };
  /** Optional — with none set, the line comes off entirely. */
  invoiceNo?: string | null;
  /** ISO or anything Date understands; blank means today. */
  invoiceDate?: string | null;
  lines: InvoiceLine[];
};

export const money = (n: number) =>
  n.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const dateAu = (d: string | null | undefined) =>
  (d ? new Date(d) : new Date()).toLocaleDateString("en-AU", {
    day: "2-digit", month: "long", year: "numeric",
  });

/** What a line comes to. Blank quantity or rate bills nothing rather than NaN. */
export const lineTotal = (l: InvoiceLine) => (l.quantity || 0) * (l.rate || 0);

export const invoiceTotal = (lines: InvoiceLine[]) =>
  lines.reduce((sum, l) => sum + lineTotal(l), 0);

/**
 * The invoice itself, as the agency receives it.
 *
 * One component for both the invoice raised against a job and the one typed
 * by hand, because the moment there are two of these they drift — and the
 * version that drifts is always the one nobody is looking at. It is also what
 * the PDF download captures, so what is on screen is what gets sent.
 */
export default function InvoiceSheet({ to, invoiceNo, invoiceDate, lines }: InvoiceSheetProps) {
  const total = invoiceTotal(lines);
  const billed = lines.length ? lines : [{ description: "", period: "", quantity: null, rate: null }];

  return (
    <div
      id="invoice-sheet"
      className="mx-auto max-w-[820px] bg-white px-12 py-12 shadow-xl print:max-w-none print:px-0 print:py-0 print:shadow-none"
    >
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
          <p className="mt-1">Company name: <span className="font-semibold">{to.company || "—"}</span></p>
          {to.attn && <p>Attn: <span className="font-semibold">{to.attn}</span></p>}
          {to.email && <p>{to.email}</p>}
          {to.address && <p>{to.address}</p>}
        </div>
        <div className="text-[15px] text-ink/85">
          {invoiceNo && <p>Invoice No: <span className="font-semibold">{invoiceNo}</span></p>}
          <p>Invoice Date: <span className="font-semibold">{dateAu(invoiceDate)}</span></p>
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
          {billed.map((l, i) => (
            <tr key={i}>
              <td className="border border-slate-300 px-3 py-3">{l.description || "—"}</td>
              <td className="border border-slate-300 px-3 py-3">{l.period || "—"}</td>
              <td className="border border-slate-300 px-3 py-3">
                {l.quantity ? l.quantity.toLocaleString("en-AU") : "—"}
              </td>
              <td className="border border-slate-300 px-3 py-3">{l.rate ? l.rate.toFixed(2) : "—"}</td>
              <td className="border border-slate-300 px-3 py-3 font-semibold">{money(lineTotal(l))}</td>
            </tr>
          ))}
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
  );
}
