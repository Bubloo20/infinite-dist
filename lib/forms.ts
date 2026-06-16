// Web3Forms public access key (safe to expose client-side — it's a form id, not a secret).
// Primary recipient is the verified Web3Forms account: infinitetutoringmelb@gmail.com.
export const WEB3FORMS_KEY =
  process.env.NEXT_PUBLIC_WEB3FORMS_KEY || "8238d15a-e799-4e82-8a18-1c83ddf60802";

// Every submission is also CC'd here, so both inboxes receive it.
const CC_EMAIL = "bubloo.mohanrajh@gmail.com";

/**
 * Send a form submission to Web3Forms. Returns true on success.
 * Delivered to infinitetutoringmelb@gmail.com AND bubloo.mohanrajh@gmail.com.
 * `fields` is keyed by the label you want to see in the email.
 */
export async function submitForm(
  fields: Record<string, string>,
  opts?: { subject?: string; from_name?: string },
): Promise<boolean> {
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_KEY,
      cc: CC_EMAIL,
      ...(opts?.subject ? { subject: opts.subject } : {}),
      ...(opts?.from_name ? { from_name: opts.from_name } : {}),
      ...fields,
    }),
  });
  const json = await res.json();
  return json.success === true || json.success === "true";
}
