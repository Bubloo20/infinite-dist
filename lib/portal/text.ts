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
