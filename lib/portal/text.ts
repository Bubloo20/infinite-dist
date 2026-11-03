/**
 * Small helpers shared by the browser and the server.
 *
 * These live apart from db.ts on purpose. That module opens a Postgres client
 * and configures the driver as soon as it loads, so importing anything from it
 * into a client component drags the driver into the browser bundle and the page
 * falls over once it renders. Nothing here touches the database.
 */

/** A record named "test" is a sandbox one — kept, shown, never counted. */
export function isTestName(name: string | null | undefined): boolean {
  return /^\s*test\s*$/i.test(String(name ?? ""));
}

/** Tracking links are stored as a JSON array; tolerate a bare string too. */
export function unpackLinks(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return v ? [v] : [];
  }
}

/* --------------------------------- hours ---------------------------------- */

/**
 * Read a length of time however it was written.
 *
 * Accepts "3.5", "3", "3 hours 30 mins", "3h 30m" — decimals and words alike,
 * because the same field gets filled in by hand and by the pay calculator.
 * Anything unreadable is nothing.
 */
export function parseHours(v: string | number | null | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v ?? "").trim();
  if (!s) return 0;

  const h = s.match(/(\d+(?:\.\d+)?)\s*(?:hours|hour|hrs|hr|h)\b/i);
  const m = s.match(/(\d+(?:\.\d+)?)\s*(?:minutes|minute|mins|min|m)\b/i);
  if (h || m) return (h ? Number(h[1]) : 0) + (m ? Number(m[1]) : 0) / 60;

  const n = s.match(/\d+(?:\.\d+)?/);
  return n ? Number(n[0]) || 0 : 0;
}

/**
 * Write it back the way a person would say it.
 *
 * "0.75 hours" is a spreadsheet talking; someone about to walk a street wants
 * to be told 45 minutes.
 */
export function formatHours(hours: number): string {
  const total = Math.round((Number.isFinite(hours) ? hours : 0) * 60);
  if (total <= 0) return "";
  const h = Math.floor(total / 60);
  const m = total % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h} hour${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} min${m === 1 ? "" : "s"}`);
  return parts.join(" ");
}

/** Whatever was typed, tidied into hours and minutes. Blank stays blank. */
export const tidyHours = (v: string | number | null | undefined): string => formatHours(parseHours(v));

/**
 * "16:30" -> "4:30 pm".
 *
 * Times are stored as 24-hour because that's what a time input gives back, but
 * nobody arranging a Saturday afternoon thinks in 24-hour. Anything shown to a
 * worker goes through here so there's no doubt which half of the day it is.
 */
export function clockLabel(hhmm: string | null | undefined): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm ?? "").trim());
  if (!m) return "";
  const h = Number(m[1]);
  const mins = Number(m[2]);
  if (h > 23 || mins > 59) return "";
  const period = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m[2]} ${period}`;
}

/**
 * A text message, ready to send, with the link already in it.
 *
 * `sms:` is handled by Phone Link on Windows and by Messages on a phone, so
 * one href covers sending from the desk and sending from the van. The empty
 * recipient is deliberate — no worker's number is on file, so the app opens on
 * the contact picker with the message already written.
 *
 * The `?&body=` spelling is not a typo: iOS wants the ampersand before the
 * first parameter and Android tolerates it, while the tidier `?body=` is the
 * one iOS quietly drops.
 */
export const smsHref = (text: string, to = "") =>
  `sms:${to}?&body=${encodeURIComponent(text)}`;

/**
 * Today, in Melbourne, as "YYYY-MM-DD".
 *
 * `new Date().toISOString()` is UTC, and Melbourne runs ten or eleven hours
 * ahead of it — so anything dated before mid-morning recorded the day before.
 * An invoice raised at nine reads as yesterday's, and so does a contract
 * signed over breakfast.
 *
 * Pinned to Melbourne rather than to whatever clock the machine keeps: the
 * server runs on UTC, and a worker's phone could be anywhere, but the date on
 * the paperwork is always the date here.
 */
export const todayAu = (): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Australia/Melbourne",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
