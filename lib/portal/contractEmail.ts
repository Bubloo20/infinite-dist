import { CONTRACT_TERMS, junkMailTerm } from "@/lib/portal/contractTerms";
import { tidyHours, clockLabel, formatHours, parseHours } from "@/lib/portal/text";

export type ContractEmail = {
  workerName: string;
  title: string;
  area: string | null;
  leaflets: number | null;
  pay: string | null;
  minHours: string | null;
  startDate: string | null;
  dueDate: string | null;
  junkMailAllowed: boolean;
  scheduleOptional: boolean;
  signedName: string;
  signedDate: string;
  signaturePng: string;
  schedule: string | null;
};

const money = (v: string | null) =>
  v ? `$${Number(v).toFixed(2)}` : "—";
const longDate = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" }) : "—";
const esc = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** The days they agreed to, read back as a list. */
function days(raw: string | null): [string, { start?: string; end?: string }][] {
  try {
    const v = raw ? JSON.parse(raw) : {};
    return Object.entries(v as Record<string, { start?: string; end?: string }>)
      .filter(([, d]) => d?.start || d?.end)
      .sort(([a], [b]) => a.localeCompare(b));
  } catch {
    return [];
  }
}

/**
 * The signed agreement as an email.
 *
 * Both copies are the same document — the worker's and the office's — so
 * neither can later be said to have agreed to something the other didn't see.
 * Written as plain tables rather than anything clever, because this has to
 * survive Gmail, Outlook and whatever an Android phone opens mail in.
 */
export function contractEmailHtml(c: ContractEmail): string {
  const rows: [string, string][] = [
    ["Contractor", c.signedName],
    ["Job", c.title],
    ["Area", c.area || "—"],
    ["Leaflets", c.leaflets != null ? c.leaflets.toLocaleString() : "—"],
    ["Payment", money(c.pay)],
    ["Minimum hours", tidyHours(c.minHours) || "—"],
    ["Start", longDate(c.startDate)],
    ["Due", longDate(c.dueDate)],
    ["Signed on", longDate(c.signedDate)],
  ];

  const sched = days(c.schedule);
  const scheduled = sched.reduce((t, [, v]) => {
    if (!v.start || !v.end) return t;
    const [sh, sm] = v.start.split(":").map(Number);
    const [eh, em] = v.end.split(":").map(Number);
    let mins = eh * 60 + em - (sh * 60 + sm);
    if (mins < 0) mins += 1440;
    return t + mins / 60;
  }, 0);

  const scheduleBlock = c.scheduleOptional
    ? `<p style="margin:0 0 6px;color:#444">No fixed schedule for this job — the drop is to be completed by the due date.</p>`
    : sched.length
      ? `<table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px">
          ${sched.map(([k, v]) => `
            <tr>
              <td style="border:1px solid #ddd"><strong>${esc(new Date(`${k}T00:00:00`).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" }))}</strong></td>
              <td style="border:1px solid #ddd">Start: ${esc(clockLabel(v.start) || "—")}</td>
              <td style="border:1px solid #ddd">End: ${esc(clockLabel(v.end) || "—")}</td>
            </tr>`).join("")}
        </table>
        <p style="margin:8px 0 0;color:#444;font-size:14px">
          ${esc(formatHours(scheduled) || "0 mins")} scheduled${
            parseHours(c.minHours) > 0 ? ` · minimum ${esc(formatHours(parseHours(c.minHours)))}` : ""}
        </p>`
      : `<p style="margin:0;color:#444">No days were recorded.</p>`;

  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f5f8;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#15131c">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:12px;padding:28px">
    <h1 style="margin:0 0 4px;font-size:22px">Independent Contractor Agreement</h1>
    <p style="margin:0 0 20px;color:#666;font-size:14px">
      Sarvesh Mohanrajh, operating under Infinite Distribution · ABN 66 177 274 211
    </p>

    <table cellpadding="6" cellspacing="0" border="0" style="border-collapse:collapse;font-size:14px;width:100%">
      ${rows.map(([k, v]) => `
        <tr>
          <td style="border:1px solid #ddd;background:#fafafa;width:40%"><strong>${esc(k)}</strong></td>
          <td style="border:1px solid #ddd">${esc(v)}</td>
        </tr>`).join("")}
    </table>

    <h2 style="margin:24px 0 8px;font-size:17px">Agreed schedule</h2>
    ${scheduleBlock}

    <h2 style="margin:24px 0 8px;font-size:17px">Terms</h2>
    <ul style="margin:0;padding-left:20px;font-size:14px;line-height:1.6;color:#333">
      <li style="font-weight:600">${esc(junkMailTerm(c.junkMailAllowed))}</li>
      ${CONTRACT_TERMS.map((t) => `<li>${esc(t)}</li>`).join("")}
    </ul>

    <h2 style="margin:24px 0 8px;font-size:17px">Signatures</h2>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;font-size:14px">
      <tr>
        <td style="vertical-align:top;width:50%;padding-right:12px">
          <p style="margin:0 0 6px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Contractor</p>
          <img src="${c.signaturePng}" alt="Signature" style="height:70px;max-width:100%;background:#15131c;border-radius:6px" />
          <p style="margin:6px 0 0"><strong>${esc(c.signedName)}</strong></p>
          <p style="margin:2px 0 0;color:#555">${esc(longDate(c.signedDate))}</p>
        </td>
        <td style="vertical-align:top;width:50%">
          <p style="margin:0 0 6px;color:#666;font-size:12px;text-transform:uppercase;letter-spacing:.08em">Infinite Distribution</p>
          <p style="margin:48px 0 0"><strong>Sarvesh Mohanrajh</strong></p>
          <p style="margin:2px 0 0;color:#555">${esc(longDate(c.signedDate))}</p>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;color:#777;font-size:12px;line-height:1.6">
      Signed electronically through the Infinite Distribution team portal. By signing, the contractor
      confirmed they had read and agreed to these terms and that they are engaged as an independent
      subcontractor, not an employee.
    </p>
  </div>
</body></html>`;
}
