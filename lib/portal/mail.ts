/**
 * Server-side email.
 *
 * Web3Forms (used by the public forms) only accepts browser submissions on the
 * free plan — it rejects server IPs — so anything sent from a cron or an API
 * route goes through Resend instead. Set RESEND_API_KEY in Vercel to switch it
 * on; until then send() reports back that it isn't configured rather than
 * failing silently.
 */

const FROM = process.env.MAIL_FROM || "Infinite Distribution <onboarding@resend.dev>";
const TO = process.env.MAIL_TO || "bubloo.mohanrajh@gmail.com";

export function mailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail(opts: { subject: string; html: string; to?: string }): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "Email is not configured. Set RESEND_API_KEY to enable it." };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: FROM,
        to: [opts.to || TO],
        subject: opts.subject,
        html: opts.html,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend responded ${res.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Send failed." };
  }
}
