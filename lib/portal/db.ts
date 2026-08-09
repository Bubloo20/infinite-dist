import { sql } from "@vercel/postgres";

export type WorkLog = {
  id: number;
  worker_name: string;
  job_number: string;
  work_date: string | null;
  started_at: string;
  ended_at: string;
  time_spent: string | null;
  strava_url: string;
  strava_status: string | null;
  strava_verified: boolean | null;
  mapmy_url: string | null;
  notes: string | null;
  created_at: string;
};

/** True once a Postgres store is attached in Vercel (env var is injected automatically). */
export function dbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

let ready = false;

async function ensureTable() {
  if (ready) return;
  await sql`
    CREATE TABLE IF NOT EXISTS work_logs (
      id SERIAL PRIMARY KEY,
      worker_name TEXT NOT NULL,
      job_number TEXT NOT NULL,
      work_date DATE,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      time_spent TEXT,
      strava_url TEXT NOT NULL,
      strava_status TEXT,
      strava_verified BOOLEAN DEFAULT FALSE,
      mapmy_url TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  ready = true;
}

export type NewWorkLog = {
  workerName: string;
  jobNumber: string;
  workDate?: string | null;
  startedAt: string;
  endedAt: string;
  timeSpent?: string | null;
  stravaUrl: string;
  stravaStatus?: string | null;
  stravaVerified?: boolean;
  mapmyUrl?: string | null;
  notes?: string | null;
};

/** Returns the new row id, or null when no database is attached. */
export async function insertWorkLog(entry: NewWorkLog): Promise<number | null> {
  if (!dbConfigured()) return null;
  await ensureTable();
  const rows = await sql<{ id: number }>`
    INSERT INTO work_logs
      (worker_name, job_number, work_date, started_at, ended_at, time_spent,
       strava_url, strava_status, strava_verified, mapmy_url, notes)
    VALUES
      (${entry.workerName}, ${entry.jobNumber}, ${entry.workDate || null},
       ${entry.startedAt}, ${entry.endedAt}, ${entry.timeSpent || null},
       ${entry.stravaUrl}, ${entry.stravaStatus || null}, ${entry.stravaVerified ?? false},
       ${entry.mapmyUrl || null}, ${entry.notes || null})
    RETURNING id;
  `;
  return rows.rows[0]?.id ?? null;
}

export async function listWorkLogs(limit = 200): Promise<WorkLog[]> {
  if (!dbConfigured()) return [];
  await ensureTable();
  const rows = await sql<WorkLog>`
    SELECT * FROM work_logs ORDER BY created_at DESC LIMIT ${limit};
  `;
  return rows.rows;
}
