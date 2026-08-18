/**
 * The invoice as a real PDF file.
 *
 * The printable page is fine for reading, but an email needs an actual file to
 * attach, so this draws the same invoice with jsPDF. Loaded on demand — it only
 * reaches the browser when someone asks for a PDF.
 */
export type InvoiceData = {
  invoiceNo: string | null;
  invoiceDate: string | null;
  jobTitle: string | null;
  area: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  agentName: string | null;
  quantity: number;
  rate: number;
  total: number;
};

const money = (v: number) =>
  v.toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const dateAu = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });

/** A file name that reads well in an inbox. */
export const invoiceFileName = (d: InvoiceData) =>
  d.invoiceNo ? `Letterbox invoice ${d.invoiceNo}.pdf` : "Letterbox invoice.pdf";

export async function buildInvoicePdf(d: InvoiceData): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 56;
  let y = 64;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Infinite Distribution", left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  y += 18;
  doc.text("Sarvesh Mohanrajh · ABN 66 177 274 211", left, y);
  y += 14;
  doc.text("infinitedistributionsmelb@gmail.com · 0421 042 007", left, y);

  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  y += 46;
  doc.text("TAX INVOICE", left, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y += 22;
  if (d.invoiceNo) { doc.text(`Invoice No: ${d.invoiceNo}`, left, y); y += 16; }
  doc.text(`Date: ${dateAu(d.invoiceDate)}`, left, y);

  // Who it's for.
  y += 34;
  doc.setFont("helvetica", "bold");
  doc.text("Bill to", left, y);
  doc.setFont("helvetica", "normal");
  y += 16;
  doc.text(d.agencyName || "—", left, y);
  if (d.agentName) { y += 15; doc.text(`Attn: ${d.agentName}`, left, y); }
  if (d.agencyAddress) {
    for (const line of doc.splitTextToSize(d.agencyAddress, 300) as string[]) {
      y += 15;
      doc.text(line, left, y);
    }
  }

  // The work.
  y += 38;
  const right = 539;
  doc.setDrawColor(210);
  doc.line(left, y, right, y);
  y += 18;
  doc.setFont("helvetica", "bold");
  doc.text("Description", left, y);
  doc.text("Qty", 330, y, { align: "right" });
  doc.text("Rate", 420, y, { align: "right" });
  doc.text("Amount", right, y, { align: "right" });
  y += 8;
  doc.line(left, y, right, y);

  doc.setFont("helvetica", "normal");
  y += 20;
  const desc = [d.jobTitle || "Letterbox distribution", d.area ? `— ${d.area}` : ""]
    .filter(Boolean).join(" ");
  doc.text(doc.splitTextToSize(desc, 250) as string[], left, y);
  doc.text(d.quantity ? d.quantity.toLocaleString() : "—", 330, y, { align: "right" });
  doc.text(d.rate ? `$${d.rate.toFixed(3).replace(/0$/, "")}` : "—", 420, y, { align: "right" });
  doc.text(`$${money(d.total)}`, right, y, { align: "right" });

  y += 26;
  doc.line(left, y, right, y);
  y += 24;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Total due", 420, y, { align: "right" });
  doc.text(`$${money(d.total)}`, right, y, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(90);
  y += 44;
  doc.text("Payment: PayID / bank transfer. Please quote the invoice number.", left, y);
  y += 14;
  doc.text("Thank you for your business.", left, y);

  return doc.output("blob");
}
