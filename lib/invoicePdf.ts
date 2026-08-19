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

/** A file name that reads well in an inbox. */
export const invoiceFileName = (invoiceNo: string | null) =>
  invoiceNo ? `Letterbox invoice ${invoiceNo}.pdf` : "Letterbox invoice.pdf";

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
