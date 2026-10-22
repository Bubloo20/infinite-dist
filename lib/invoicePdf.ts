/**
 * The invoice as a PDF that matches the page.
 *
 * It used to be drawn by hand with jsPDF, which meant the download never quite
 * looked like the invoice on screen and the two designs drifted apart. Instead
 * the printed sheet itself is captured, so what you download is what you saw.
 *
 * Both libraries are imported on demand — they only reach the browser when
 * someone actually asks for a PDF.
 */

/** The width the sheet is designed at, whatever the screen is doing. */
const SHEET_WIDTH = 820;

/**
 * A file name that says who it's for.
 *
 * These end up in an inbox and a downloads folder among other invoices, so the
 * agency's name is worth more there than anything else — "Invoice 01 - Nelson
 * Alexander.pdf" is findable months later in a way "Letterbox invoice.pdf" is
 * not. Characters a file system won't take are dropped.
 */
/**
 * What the invoice is called once it leaves here.
 *
 * The agency, the invoice date and what it is for — which is how it gets
 * filed and searched for months later, by somebody who only has the file.
 * The date is written exactly as the invoice prints it, so the name and the
 * page agree.
 */
export const invoiceFileName = (
  agency?: string | null,
  invoiceDate?: string | null,
  // What the work was, so a boards invoice doesn't file itself under leaflets.
  what: string = "Letterbox Drop Invoice",
) => {
  // Windows refuses these outright; a stray run of spaces just reads badly.
  const safe = (v: string) => v.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
  const on = invoiceDate ? new Date(invoiceDate) : new Date();
  const when = Number.isNaN(on.getTime())
    ? ""
    : on.toLocaleDateString("en-AU", { day: "2-digit", month: "long", year: "numeric" });
  const parts = [agency ? safe(agency) : "", when, safe(what)].filter(Boolean);
  return `${parts.join(" - ")}.pdf`;
};

/**
 * Render an element to a PDF page.
 *
 * The capture is laid out at the sheet's full width rather than the width of
 * whatever screen it was triggered from — otherwise downloading on a phone
 * would bake the squashed mobile layout into the file. It's taken at twice
 * size so the text stays sharp in print, then scaled to fit the page.
 */
export async function elementToPdf(el: HTMLElement): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    // Lay the clone out on a desktop-sized window so the design holds.
    windowWidth: Math.max(SHEET_WIDTH + 260, window.innerWidth),
    windowHeight: Math.max(1200, window.innerHeight),
    onclone: (doc: Document) => {
      const clone = (el.id ? doc.getElementById(el.id) : null) as HTMLElement | null;
      if (clone) {
        clone.style.width = `${SHEET_WIDTH}px`;
        clone.style.maxWidth = "none";
      }
    },
    // Anything that only exists for the screen stays off the page.
    ignoreElements: (node) => node.classList?.contains("print:hidden"),
  });

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const w = pageW;
  const h = (canvas.height / canvas.width) * w;
  const img = canvas.toDataURL("image/jpeg", 0.92);

  if (h <= pageH) {
    doc.addImage(img, "JPEG", 0, 0, w, h);
  } else {
    // Taller than a page: slice it across as many pages as it needs.
    let offset = 0;
    while (offset < h) {
      if (offset > 0) doc.addPage();
      doc.addImage(img, "JPEG", 0, -offset, w, h);
      offset += pageH;
    }
  }

  return doc.output("blob");
}
