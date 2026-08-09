export type StravaStatus = "valid" | "invalid-format" | "not-found" | "private" | "unverified";

export type StravaCheck = {
  /** Format is a real Strava activity URL. */
  ok: boolean;
  /** We reached Strava and the activity exists. */
  verified: boolean;
  status: StravaStatus;
  message: string;
  activityId?: string;
  normalisedUrl?: string;
};

/**
 * Accepts the canonical activity URL, with or without www/http, trailing
 * segments (/overview) or query strings:
 *   strava.com/activities/1234567890
 */
const ACTIVITY_RE = /^(?:https?:\/\/)?(?:www\.)?strava\.com\/activities\/(\d{6,20})(?:[/?#].*)?$/i;

/** Shape check only — no network. Safe to run in the browser. */
export function parseStravaUrl(raw: string): StravaCheck {
  const url = (raw || "").trim();
  if (!url) {
    return { ok: false, verified: false, status: "invalid-format", message: "Paste your Strava activity link." };
  }
  const m = url.match(ACTIVITY_RE);
  if (!m) {
    if (/strava\.app\.link|strava\.com\/athlete|strava\.com\/routes/i.test(url)) {
      return {
        ok: false,
        verified: false,
        status: "invalid-format",
        message: "That's not an activity link. Open the activity itself and copy the URL (strava.com/activities/…).",
      };
    }
    return {
      ok: false,
      verified: false,
      status: "invalid-format",
      message: "Must be a Strava activity link, e.g. https://www.strava.com/activities/1234567890",
    };
  }
  const activityId = m[1];
  return {
    ok: true,
    verified: false,
    status: "unverified",
    message: "Link looks right — checking with Strava…",
    activityId,
    normalisedUrl: `https://www.strava.com/activities/${activityId}`,
  };
}

/**
 * Live check: does this activity actually exist on Strava?
 *
 * Strava puts a login wall in front of activity pages, so the page body can't
 * be read — and its HTML contains the phrase "doesn't exist" on every response,
 * including valid ones, so matching on text gives false rejections.
 *
 * The reliable signal is the redirect. Verified against live Strava:
 *   real id  -> stays on /activities/<id>
 *   dead id  -> 302s to /register/free (or /login)
 * Adjacent ids behave differently (…000 stays, …001 redirects), so this is a
 * genuine per-activity lookup rather than a range heuristic.
 *
 * Fails open: network errors, timeouts and rate limits return "unverified"
 * rather than "not-found", so a real activity is never rejected because of a
 * problem on our end.
 */
export async function verifyStravaActivity(raw: string): Promise<StravaCheck> {
  const parsed = parseStravaUrl(raw);
  if (!parsed.ok || !parsed.normalisedUrl || !parsed.activityId) return parsed;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    const res = await fetch(parsed.normalisedUrl, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-AU,en;q=0.9",
      },
      cache: "no-store",
    });
    clearTimeout(timeout);

    if (res.status === 404) {
      return { ...parsed, ok: false, verified: false, status: "not-found", message: "Strava says this activity doesn't exist. Double-check the link." };
    }

    if (res.status === 403 || res.status === 429) {
      return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link looks valid — Strava rate-limited our check, so the office will confirm it." };
    }

    const landed = res.url || "";

    // Still on the activity URL => the activity exists.
    if (landed.includes(`/activities/${parsed.activityId}`)) {
      return { ...parsed, ok: true, verified: true, status: "valid", message: "Strava activity found and verified." };
    }

    // Bounced to the signup/login wall => no such activity, or it's not public.
    if (/\/register|\/login|\/onboarding|\/dashboard/i.test(landed)) {
      return {
        ...parsed,
        ok: false,
        verified: false,
        status: "not-found",
        message: "Strava couldn't open this activity — it either doesn't exist or isn't public. Check the link and make sure the activity is public.",
      };
    }

    return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link format is valid (couldn't confirm with Strava)." };
  } catch {
    return { ...parsed, ok: true, verified: false, status: "unverified", message: "Link format is valid (couldn't reach Strava to confirm)." };
  }
}

/** Map My Run / Ride / Walk — optional field, light check only. */
export function isMapMyActivityUrl(raw: string): boolean {
  const url = (raw || "").trim();
  if (!url) return true;
  return /^(?:https?:\/\/)?(?:www\.)?(mapmyrun|mapmyride|mapmywalk|mapmyfitness)\.com\/.+/i.test(url);
}
