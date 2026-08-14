import { sql } from "@vercel/postgres";

export type PortalUser = {
  id: number;
  full_name: string;
  name_key: string;
  bank_name: string | null;
  bank_bsb: string | null;
  bank_account: string | null;
  payid: string | null;
  created_at: string;
};

export type WorkLog = {
  id: number;
  user_id: number | null;
  worker_name: string;
  job_number: string;
  started_at: string;
  ended_at: string;
  time_spent: string | null;
  leaflet_count: number | null;
  area_worked: string | null;
  amount: string | null;
  paid_on: string | null;
  strava_urls: string | null;
  mapmy_urls: string | null;
  strava_status: string | null;
  strava_verified: boolean | null;
  notes: string | null;
  created_at: string;
};

export type Payment = {
  id: number;
  user_id: number;
  amount: string;
  paid_on: string | null;
  method: string | null;
  note: string | null;
  created_at: string;
};

export function dbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

/** Links are stored as a JSON array in a text column. */
export const packLinks = (urls: string[]) => JSON.stringify(urls.filter(Boolean));
export function unpackLinks(v: string | null): string[] {
  if (!v) return [];
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return v ? [v] : [];
  }
}

let ready = false;

export async function ensureSchema() {
  if (ready) return;

  await sql`
    CREATE TABLE IF NOT EXISTS portal_users (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      name_key TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      bank_name TEXT,
      bank_bsb TEXT,
      bank_account TEXT,
      payid TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS work_logs (
      id SERIAL PRIMARY KEY,
      worker_name TEXT NOT NULL,
      job_number TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      time_spent TEXT,
      strava_url TEXT,
      strava_status TEXT,
      strava_verified BOOLEAN DEFAULT FALSE,
      mapmy_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Incremental upgrades — all safe to re-run.
  await sql`ALTER TABLE work_logs ALTER COLUMN strava_url DROP NOT NULL;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS leaflet_count INTEGER;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS area_worked TEXT;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS paid_on DATE;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS strava_urls TEXT;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS mapmy_urls TEXT;`;

  await sql`
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      paid_on DATE,
      method TEXT,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Revenue and non-labour expenses, so profit can be reported.
  await sql`
    CREATE TABLE IF NOT EXISTS finance_entries (
      id SERIAL PRIMARY KEY,
      kind TEXT NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      category TEXT,
      description TEXT,
      entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  ready = true;
}

/* --------------------------------- finance -------------------------------- */

export type FinanceEntry = {
  id: number;
  kind: "revenue" | "expense";
  amount: string;
  category: string | null;
  description: string | null;
  entry_date: string;
  created_at: string;
};

export async function listFinanceEntries(limit = 500): Promise<FinanceEntry[]> {
  await ensureSchema();
  const r = await sql<FinanceEntry>`
    SELECT * FROM finance_entries ORDER BY entry_date DESC, id DESC LIMIT ${limit};
  `;
  return r.rows;
}

export async function addFinanceEntry(e: {
  kind: "revenue" | "expense";
  amount: number;
  category?: string | null;
  description?: string | null;
  entryDate?: string | null;
}) {
  await ensureSchema();
  const r = await sql<{ id: number }>`
    INSERT INTO finance_entries (kind, amount, category, description, entry_date)
    VALUES (${e.kind}, ${e.amount}, ${e.category || null}, ${e.description || null},
            ${e.entryDate || new Date().toISOString().slice(0, 10)})
    RETURNING id;
  `;
  return r.rows[0].id;
}

export async function deleteFinanceEntry(id: number) {
  await ensureSchema();
  await sql`DELETE FROM finance_entries WHERE id = ${id};`;
}

/* ---------------------------------- users --------------------------------- */

export const nameKey = (fullName: string) => fullName.trim().toLowerCase().replace(/\s+/g, " ");

export async function findUserByName(fullName: string) {
  await ensureSchema();
  const r = await sql<PortalUser & { password_hash: string }>`
    SELECT * FROM portal_users WHERE name_key = ${nameKey(fullName)} LIMIT 1;
  `;
  return r.rows[0] || null;
}

export async function findUserById(id: number) {
  await ensureSchema();
  const r = await sql<PortalUser>`SELECT * FROM portal_users WHERE id = ${id} LIMIT 1;`;
  return r.rows[0] || null;
}

export async function createUser(fullName: string, passwordHash: string) {
  await ensureSchema();
  const r = await sql<{ id: number }>`
    INSERT INTO portal_users (full_name, name_key, password_hash)
    VALUES (${fullName.trim()}, ${nameKey(fullName)}, ${passwordHash})
    RETURNING id;
  `;
  return r.rows[0].id;
}

export async function listUsers(): Promise<PortalUser[]> {
  await ensureSchema();
  const r = await sql<PortalUser>`
    SELECT id, full_name, name_key, bank_name, bank_bsb, bank_account, payid, created_at
    FROM portal_users ORDER BY full_name ASC;
  `;
  return r.rows;
}

export async function updateUserPayDetails(
  id: number,
  d: { bankName?: string | null; bankBsb?: string | null; bankAccount?: string | null; payid?: string | null },
) {
  await ensureSchema();
  await sql`
    UPDATE portal_users SET
      bank_name = ${d.bankName ?? null},
      bank_bsb = ${d.bankBsb ?? null},
      bank_account = ${d.bankAccount ?? null},
      payid = ${d.payid ?? null}
    WHERE id = ${id};
  `;
}

/* -------------------------------- work logs ------------------------------- */

export type NewWorkLog = {
  userId: number | null;
  workerName: string;
  jobNumber: string;
  startedAt: string;
  endedAt: string;
  timeSpent?: string | null;
  leafletCount?: number | null;
  areaWorked?: string | null;
  stravaUrls: string[];
  stravaStatus?: string | null;
  stravaVerified?: boolean;
  mapmyUrls?: string[];
  notes?: string | null;
};

export async function insertWorkLog(e: NewWorkLog): Promise<number | null> {
  if (!dbConfigured()) return null;
  await ensureSchema();
  const r = await sql<{ id: number }>`
    INSERT INTO work_logs
      (user_id, worker_name, job_number, started_at, ended_at, time_spent,
       leaflet_count, area_worked, strava_url, strava_urls, strava_status,
       strava_verified, mapmy_urls, notes)
    VALUES
      (${e.userId}, ${e.workerName}, ${e.jobNumber}, ${e.startedAt}, ${e.endedAt},
       ${e.timeSpent || null}, ${e.leafletCount ?? null}, ${e.areaWorked || null},
       ${e.stravaUrls[0] || null}, ${packLinks(e.stravaUrls)}, ${e.stravaStatus || null},
       ${e.stravaVerified ?? false}, ${packLinks(e.mapmyUrls || [])}, ${e.notes || null})
    RETURNING id;
  `;
  return r.rows[0]?.id ?? null;
}

export async function listWorkLogs(limit = 500): Promise<WorkLog[]> {
  if (!dbConfigured()) return [];
  await ensureSchema();
  const r = await sql<WorkLog>`SELECT * FROM work_logs ORDER BY created_at DESC LIMIT ${limit};`;
  return r.rows;
}

export async function listWorkLogsForUser(userId: number): Promise<WorkLog[]> {
  if (!dbConfigured()) return [];
  await ensureSchema();
  const r = await sql<WorkLog>`
    SELECT * FROM work_logs WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 300;
  `;
  return r.rows;
}

/** Admin sets what a job is worth. */
export async function setWorkLogAmount(id: number, amount: number | null) {
  await ensureSchema();
  await sql`UPDATE work_logs SET amount = ${amount} WHERE id = ${id};`;
}

/** Admin marks a job paid (or back to unpaid with null). */
export async function setWorkLogPaid(id: number, paidOn: string | null) {
  await ensureSchema();
  await sql`UPDATE work_logs SET paid_on = ${paidOn} WHERE id = ${id};`;
}

/* -------------------------------- payments -------------------------------- */

export async function listPayments(): Promise<Payment[]> {
  await ensureSchema();
  const r = await sql<Payment>`SELECT * FROM payments ORDER BY COALESCE(paid_on, created_at::date) DESC, id DESC LIMIT 500;`;
  return r.rows;
}

export async function listPaymentsForUser(userId: number): Promise<Payment[]> {
  await ensureSchema();
  const r = await sql<Payment>`
    SELECT * FROM payments WHERE user_id = ${userId}
    ORDER BY COALESCE(paid_on, created_at::date) DESC, id DESC LIMIT 300;
  `;
  return r.rows;
}

export async function addPayment(p: {
  userId: number;
  amount: number;
  paidOn?: string | null;
  method?: string | null;
  note?: string | null;
}) {
  await ensureSchema();
  const r = await sql<{ id: number }>`
    INSERT INTO payments (user_id, amount, paid_on, method, note)
    VALUES (${p.userId}, ${p.amount}, ${p.paidOn || null}, ${p.method || null}, ${p.note || null})
    RETURNING id;
  `;
  return r.rows[0].id;
}

export async function deletePayment(id: number) {
  await ensureSchema();
  await sql`DELETE FROM payments WHERE id = ${id};`;
}
