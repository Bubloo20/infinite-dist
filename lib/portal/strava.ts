export type StravaStatus =
  | "valid" | "invalid-format" | "not-found" | "private"
  | "ambiguous-name" | "date-mismatch" | "unverified";

export type StravaCheck = {
  /** Safe to accept. */
  ok: boolean;
  /** We read the activity's details from Strava. */
  verified: boolean;
  status: StravaStatus;
  message: string;
  activityId?: string;
  normalisedUrl?: string;
  athlete?: string | null;
  activityType?: string | null;
  activityDate?: string | null;
};

const ACTIVITY_RE = /^(?:https?:\/\/)?(?:www\.)?strava\.com\/activities\/(\d{6,20})(?:[/?#].*)?$/i;

/** Link-preview agent: Strava serves full OpenGraph tags to crawlers. */
const CRAWLER_UA = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";

/** Shape check only — no network. Safe in the browser. */
export function parseStravaUrl(raw: string): StravaCheck {
  const url = (raw || "").trim();
  if (!url) return { ok: false, verified: false, status: "invalid-format", message: "Paste your Strava activity link." };

  const m = url.match(ACTIVITY_RE);
  if (!m) {
    if (/strava\.app\.link|strava\.com\/athlete|strava\.com\/routes/i.test(url)) {
      return { ok: false, verified: false, status: "invalid-format", message: "That's not an activity link. Open the activity and copy its URL (strava.com/activities/…)." };
    }
    return { ok: false, verified: false, status: "invalid-format", message: "Must be a Strava activity link, e.g. https://www.strava.com/activities/1234567890" };
  }
  const activityId = m[1];
  return {
    ok: true, verified: false, status: "unverified",
    message: "Link looks right — checking with Strava…",
    activityId, normalisedUrl: `https://www.strava.com/activities/${activityId}`,
  };
}

/**
 * A tracked account has to be identifiable. Rejects placeholders like
 * "... ...", "000 000", "ooo ooo", "- -" and single-letter handles.
 */
export function isAmbiguousName(raw: string | null | undefined): boolean {
  const n = (raw || "").trim();
  if (!n) return true;
  const letters = n.replace(/[^a-z]/gi, "");
  if (letters.length < 3) return true;                       // "0 0", "A B", "..."
  if (/^[\W_\s]+$/.test(n)) return true;                     // punctuation only
  const distinct = new Set(n.toLowerCase().replace(/[\s._-]/g, "").split(""));
  if (distinct.size <= 2) return true;                       // "ooo ooo", "aaaa"
  if (/^(.)\1+$/.test(n.toLowerCase().replace(/\s/g, ""))) return true;
  return false;
}

/** "View Anshu Gaind's Run on November 28, 2024 | Strava" */
function parseOgDescription(desc: string): { athlete: string | null; type: string | null; date: string | null } {
  const clean = desc.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&");
  const m = clean.match(/View\s+(.+?)'s\s+(.+?)\s+on\s+(.+?)\s*(?:\||$)/i);
  if (!m) return { athlete: null, type: null, date: null };
  return { athlete: m[1].trim(), type: m[2].trim(), date: m[3].trim() };
}

const dayOf = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/**
 * Live check. Reads the activity's OpenGraph card, which Strava serves to
 * crawlers even though the page itself is behind a login wall, so we can
 * confirm the activity exists, who tracked it, and when.
 *
 * `window` optionally constrains the activity date to the shift's start/end
 * (one day of slack each side for timezone rollover).
 *
 * Fails open on network trouble: a timeout or rate limit returns "unverified"
 * rather than rejecting a genuine link.
 */
export async function verifyStravaActivity(
  raw: string,
  window?: { startedAt?: string | null; endedAt?: string | null },
): Promise<StravaCheck> {
  const parsed = parseStravaUrl(raw);
  if (!parsed.ok || !parsed.normalisedUrl || !parsed.activityId) return parsed;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(parsed.normalisedUrl, {
      redirect: "follow", signal: controller.signal, cache: "no-store",
      headers: { "User-Agent": CRAWLER_UA, Accept: "text/html", "Accept-Language": "en-AU,en;q=0.9" },
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return { ...parsed, ok: false, verified: false, status: "not-found", message: "Strava says this activity doesn't exist." };
    }
    if (res.status === 403 || res.status === 429) {
      return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link is valid — Strava rate-limited our check, the office will confirm." };
    }

    const landed = res.url || "";
    const html = (await res.text()).slice(0, 250000);

    const og: Record<string, string> = {};
    for (const m of html.matchAll(/<meta[^>]+property="og:([a-z:]+)"[^>]*content="([^"]*)"/g)) og[m[1]] = m[2];

    // No activity card and bounced to signup => the activity isn't there.
    if (!og.description && /\/register|\/login|\/onboarding/i.test(landed)) {
      return { ...parsed, ok: false, verified: false, status: "not-found", message: "Strava couldn't open this activity — it either doesn't exist or isn't public." };
    }
    if (!og.description) {
      return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link is valid but Strava didn't return activity details." };
    }

    const { athlete, type, date } = parseOgDescription(og.description);
    const base = { ...parsed, athlete, activityType: type, activityDate: date };

    if (athlete && isAmbiguousName(athlete)) {
      return { ...base, ok: false, verified: false, status: "ambiguous-name",
        message: `The Strava account tracking this ("${athlete}") isn't a recognisable name. Use an account with your real name.` };
    }

    // Activity date must fall inside the shift.
    if (date && (window?.startedAt || window?.endedAt)) {
      const actual = new Date(date);
      if (!Number.isNaN(actual.getTime())) {
        const a = dayOf(actual);
        const from = window.startedAt ? dayOf(new Date(window.startedAt)) : null;
        const to = window.endedAt ? dayOf(new Date(window.endedAt)) : null;
        const DAY = 86400000;
        if ((from !== null && a < from - DAY) || (to !== null && a > to + DAY)) {
          return { ...base, ok: false, verified: false, status: "date-mismatch",
            message: `This activity is from ${date}, which is outside the shift you entered. Check the dates or the link.` };
        }
      }
    }

    const who = athlete ? ` by ${athlete}` : "";
    const when = date ? ` on ${date}` : "";
    return { ...base, ok: true, verified: true, status: "valid", message: `Verified${who}${when}.` };
  } catch {
    return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link is valid (couldn't reach Strava to confirm)." };
  }
}

/** Map My Run / Ride / Walk — optional field. */
export function isMapMyActivityUrl(raw: string): boolean {
  const url = (raw || "").trim();
  if (!url) return true;
  return /^(?:https?:\/\/)?(?:www\.)?(mapmyrun|mapmyride|mapmywalk|mapmyfitness)\.com\/.+/i.test(url);
}
