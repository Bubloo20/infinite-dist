// Web3Forms public access keys (safe to expose client-side — they're form ids, not secrets).
// Each form delivers to ONE inbox on the free plan, so we submit to both to reach both inboxes:
//   key 1 -> infinitetutoringmelb@gmail.com
//   key 2 -> bubloo.mohanrajh@gmail.com
const WEB3FORMS_KEYS = [
  "8238d15a-e799-4e82-8a18-1c83ddf60802",
  "a7dc20f0-7282-44a4-b8b6-4ee77f62463f",
];

/**
 * Send a form submission to Web3Forms. Returns true if it reached at least one inbox.
 * Delivered to BOTH infinitetutoringmelb@gmail.com AND bubloo.mohanrajh@gmail.com.
 * `fields` is keyed by the label you want to see in the email.
 */
export async function submitForm(
  fields: Record<string, string>,
  opts?: { subject?: string; from_name?: string },
): Promise<boolean> {
  const payload = (access_key: string) => ({
    access_key,
    ...(opts?.subject ? { subject: opts.subject } : {}),
    ...(opts?.from_name ? { from_name: opts.from_name } : {}),
    ...fields,
  });

  const results = await Promise.allSettled(
    WEB3FORMS_KEYS.map((key) =>
      fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload(key)),
      }).then((r) => r.json()),
    ),
  );

  // Succeeded if at least one inbox accepted it.
  return results.some(
    (r) => r.status === "fulfilled" && (r.value?.success === true || r.value?.success === "true"),
  );
}
