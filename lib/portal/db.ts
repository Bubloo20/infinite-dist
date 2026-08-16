import { sql } from "@vercel/postgres";
import { types } from "@neondatabase/serverless";

/**
 * Return DATE columns as plain "YYYY-MM-DD" strings.
 *
 * By default the driver hands back a JS Date at local midnight; serialising
 * that to JSON converts it to UTC, which rolls the day backwards in Melbourne
 * (UTC+10). A job completed on the 14th came back as the 13th. Dates here are
 * calendar days with no time component, so keeping them as text is both
 * correct and stable regardless of server timezone.
 */
types.setTypeParser(1082, (v: string) => v);

export type PortalUser = {
  id: number;
  full_name: string;
  name_key: string;
  bank_name: string | null;
  bank_bsb: string | null;
  bank_account: string | null;
  payid: string | null;
  area: string | null;
  notes: string | null;
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
  paid_at: string | null;
  verified_at: string | null;
  assignment_id: number | null;
  client_job_id: number | null;
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

let schemaReady: Promise<void> | null = null;

/**
 * Bring the schema up to date, once per process.
 *
 * The promise is cached rather than a "done" flag: a page load fires several
 * queries at once, and with a flag that only flips at the end they each saw
 * "not ready" and re-ran all forty-odd statements in parallel. Sharing the
 * promise means the first caller migrates and the rest simply wait for it.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = migrateSchema().catch((e) => {
      schemaReady = null; // a failed migration shouldn't poison every later call
      throw e;
    });
  }
  return schemaReady;
}

async function migrateSchema(): Promise<void> {
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

  // Areas each worker covers (from the ledger's workforce list).
  await sql`ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS area TEXT;`;
  await sql`ALTER TABLE portal_users ADD COLUMN IF NOT EXISTS notes TEXT;`;

  // Incremental upgrades — all safe to re-run.
  await sql`ALTER TABLE work_logs ALTER COLUMN strava_url DROP NOT NULL;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS user_id INTEGER;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS leaflet_count INTEGER;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS area_worked TEXT;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2);`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS paid_on DATE;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;`;
  // Marked done by the worker, then checked off by the office before it's owed.
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;`;
  // Each sub-contract is its own piece of work: signed on its own, marked done
  // on its own, even when one worker holds several on the same job.
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS assignment_id INTEGER;`;
  await sql`ALTER TABLE job_contracts ADD COLUMN IF NOT EXISTS assignment_id INTEGER;`;
  await sql`ALTER TABLE job_contracts DROP CONSTRAINT IF EXISTS job_contracts_job_id_user_id_key;`;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS job_contracts_assignment_key
      ON job_contracts (assignment_id) WHERE assignment_id IS NOT NULL;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS strava_urls TEXT;`;
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS mapmy_urls TEXT;`;
  // Ties a worker's earnings to the agency job they were paid for.
  await sql`ALTER TABLE work_logs ADD COLUMN IF NOT EXISTS client_job_id INTEGER;`;

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

  // Clients (real estate agencies etc.) and the agents inside them.
  await sql`
    CREATE TABLE IF NOT EXISTS agencies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      price_per_leaflet NUMERIC(6,3),
      email TEXT,
      phone TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS agents (
      id SERIAL PRIMARY KEY,
      agency_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  /**
   * A job we do for an agency.
   *   status:  to_send (red) | out_for_delivery (orange) | completed (green)
   *   invoice: not_sent | sent | received
   */
  await sql`
    CREATE TABLE IF NOT EXISTS client_jobs (
      id SERIAL PRIMARY KEY,
      agency_id INTEGER,
      agent_id INTEGER,
      title TEXT,
      area TEXT,
      leaflet_type TEXT,
      quantity INTEGER,
      rate_per_leaflet NUMERIC(6,3),
      amount NUMERIC(10,2),
      status TEXT NOT NULL DEFAULT 'to_send',
      invoice_status TEXT NOT NULL DEFAULT 'not_sent',
      invoice_no TEXT,
      invoice_date DATE,
      picked_on DATE,
      completed_on DATE,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Marketplace + assignment fields on a job.
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT FALSE;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS assigned_user_id INTEGER;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS worker_pay NUMERIC(10,2);`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS allocated_time TEXT;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS min_hours TEXT;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS boundary TEXT;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS map_center TEXT;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS map_image TEXT;`;
  // Reference the office uses, and how many of the quantity are actually out.
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS job_number TEXT;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS delivered_count INTEGER;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS out_count INTEGER;`;
  // Each agency runs its own invoice sequence, and some invoices go out with no
  // number at all.
  await sql`ALTER TABLE agencies ADD COLUMN IF NOT EXISTS invoice_seq INTEGER;`;
  await sql`ALTER TABLE client_jobs ADD COLUMN IF NOT EXISTS invoice_no_hidden BOOLEAN DEFAULT FALSE;`;
  // A sub-contract can carry its own traced area, separate from the whole job's.
  // A worker can hold several sub-contracts on one job — different streets,
  // different weeks — so the one-per-worker constraint had to go.
  await sql`ALTER TABLE job_assignments DROP CONSTRAINT IF EXISTS job_assignments_job_id_user_id_key;`;
  await sql`ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS boundary TEXT;`;
  await sql`ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS map_center TEXT;`;

  /**
   * A job split across several workers. Each sub-contract carries its own pay,
   * leaflet share and dates, so one job can run with three people on different
   * schedules. The older single-worker `assigned_user_id` still works.
   */
  await sql`
    CREATE TABLE IF NOT EXISTS job_assignments (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      pay NUMERIC(10,2),
      leaflet_share INTEGER,
      area_note TEXT,
      start_date DATE,
      due_date DATE,
      status TEXT NOT NULL DEFAULT 'assigned',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, user_id)
    );
  `;

  // Per-sub-contract hours, timeframe and an optional area diagram.
  await sql`ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS min_hours TEXT;`;
  await sql`ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS allocated_time TEXT;`;
  await sql`ALTER TABLE job_assignments ADD COLUMN IF NOT EXISTS map_image TEXT;`;

  // Workers registering interest in a published job.
  await sql`
    CREATE TABLE IF NOT EXISTS job_interest (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, user_id)
    );
  `;

  // A signed contractor agreement for one job.
  await sql`
    CREATE TABLE IF NOT EXISTS job_contracts (
      id SERIAL PRIMARY KEY,
      job_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      signed_name TEXT NOT NULL,
      signature_png TEXT NOT NULL,
      signed_date DATE NOT NULL,
      schedule TEXT,
      agreed BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (job_id, user_id)
    );
  `;

  // Money an agency has paid us.
  await sql`
    CREATE TABLE IF NOT EXISTS agency_payments (
      id SERIAL PRIMARY KEY,
      agency_id INTEGER NOT NULL,
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

}

/* -------------------------- agencies, agents, jobs ------------------------- */

export type Agency = {
  id: number; name: string; price_per_leaflet: string | null; invoice_seq: number | null;
  email: string | null; phone: string | null; address: string | null;
  notes: string | null; created_at: string;
};
/**
 * Anything named "test" is a sandbox record — it's kept and shown, but never
 * counted in revenue, profit, what's owed, or the finance chart.
 */
export function isTestName(name: string | null | undefined): boolean {
  return /^\s*test\s*$/i.test(String(name ?? ""));
}

export type Agent = {
  id: number; agency_id: number; name: string;
  email: string | null; phone: string | null; notes: string | null; created_at: string;
};
export type JobStatus = "to_send" | "out_for_delivery" | "completed";
export type InvoiceStatus = "not_sent" | "sent" | "received";
export type ClientJob = {
  id: number; agency_id: number | null; agent_id: number | null;
  title: string | null; area: string | null; leaflet_type: string | null;
  quantity: number | null; rate_per_leaflet: string | null; amount: string | null;
  status: JobStatus; invoice_status: InvoiceStatus;
  invoice_no: string | null; invoice_date: string | null; invoice_no_hidden: boolean | null;
  picked_on: string | null; completed_on: string | null;
  notes: string | null; created_at: string;
  // marketplace / assignment
  published: boolean | null;
  assigned_user_id: number | null;
  worker_pay: string | null;
  allocated_time: string | null;
  min_hours: string | null;
  boundary: string | null;
  map_center: string | null;
  map_image: string | null;
  job_number: string | null;
  delivered_count: number | null;
  out_count: number | null;
};
export type JobAssignment = {
  id: number; job_id: number; user_id: number;
  pay: string | null; leaflet_share: number | null; area_note: string | null;
  start_date: string | null; due_date: string | null;
  min_hours: string | null; allocated_time: string | null; map_image: string | null;
  boundary: string | null; map_center: string | null;
  status: string; created_at: string;
};

export type JobInterest = {
  id: number; job_id: number; user_id: number; note: string | null; created_at: string;
};
export type JobContract = {
  id: number; job_id: number; user_id: number; assignment_id: number | null; signed_name: string;
  signature_png: string; signed_date: string; schedule: string | null;
  agreed: boolean; created_at: string;
};

export type AgencyPayment = {
  id: number; agency_id: number; amount: string;
  paid_on: string | null; method: string | null; note: string | null; created_at: string;
};

export async function listAgencies(): Promise<Agency[]> {
  await ensureSchema();
  return (await sql<Agency>`SELECT * FROM agencies ORDER BY name ASC;`).rows;
}
export async function upsertAgency(a: {
  id?: number | null; name: string; pricePerLeaflet?: number | null;
  email?: string | null; phone?: string | null; address?: string | null; notes?: string | null;
  invoiceSeq?: number | null;
}) {
  await ensureSchema();
  if (a.id) {
    await sql`
      UPDATE agencies SET name=${a.name}, price_per_leaflet=${a.pricePerLeaflet ?? null},
        email=${a.email ?? null}, phone=${a.phone ?? null}, address=${a.address ?? null}, notes=${a.notes ?? null},
        invoice_seq=${a.invoiceSeq ?? null}
      WHERE id=${a.id};`;
    return a.id;
  }
  const r = await sql<{ id: number }>`
    INSERT INTO agencies (name, price_per_leaflet, email, phone, address, notes, invoice_seq)
    VALUES (${a.name}, ${a.pricePerLeaflet ?? null}, ${a.email ?? null}, ${a.phone ?? null},
            ${a.address ?? null}, ${a.notes ?? null}, ${a.invoiceSeq ?? null})
    RETURNING id;`;
  return r.rows[0].id;
}
export async function deleteAgency(id: number) {
  await ensureSchema();
  await sql`DELETE FROM agents WHERE agency_id=${id};`;
  await sql`DELETE FROM agency_payments WHERE agency_id=${id};`;
  await sql`UPDATE client_jobs SET agency_id=NULL WHERE agency_id=${id};`;
  await sql`DELETE FROM agencies WHERE id=${id};`;
}

export async function listAgents(): Promise<Agent[]> {
  await ensureSchema();
  return (await sql<Agent>`SELECT * FROM agents ORDER BY name ASC;`).rows;
}
export async function upsertAgent(a: {
  id?: number | null; agencyId: number; name: string;
  email?: string | null; phone?: string | null; notes?: string | null;
}) {
  await ensureSchema();
  if (a.id) {
    await sql`UPDATE agents SET name=${a.name}, email=${a.email ?? null}, phone=${a.phone ?? null}, notes=${a.notes ?? null} WHERE id=${a.id};`;
    return a.id;
  }
  const r = await sql<{ id: number }>`
    INSERT INTO agents (agency_id, name, email, phone, notes)
    VALUES (${a.agencyId}, ${a.name}, ${a.email ?? null}, ${a.phone ?? null}, ${a.notes ?? null})
    RETURNING id;`;
  return r.rows[0].id;
}
export async function deleteAgent(id: number) {
  await ensureSchema();
  await sql`UPDATE client_jobs SET agent_id=NULL WHERE agent_id=${id};`;
  await sql`DELETE FROM agents WHERE id=${id};`;
}

export async function listClientJobs(limit = 500): Promise<ClientJob[]> {
  await ensureSchema();
  return (await sql<ClientJob>`SELECT * FROM client_jobs ORDER BY COALESCE(completed_on, picked_on, created_at::date) DESC, id DESC LIMIT ${limit};`).rows;
}
export async function getClientJob(id: number): Promise<ClientJob | null> {
  await ensureSchema();
  return (await sql<ClientJob>`SELECT * FROM client_jobs WHERE id=${id} LIMIT 1;`).rows[0] || null;
}
export async function upsertClientJob(j: {
  id?: number | null; agencyId?: number | null; agentId?: number | null;
  title?: string | null; area?: string | null; leafletType?: string | null;
  quantity?: number | null; ratePerLeaflet?: number | null; amount?: number | null;
  status?: JobStatus; invoiceStatus?: InvoiceStatus; invoiceNo?: string | null; invoiceNoHidden?: boolean;
  invoiceDate?: string | null; pickedOn?: string | null; completedOn?: string | null; notes?: string | null;
}) {
  await ensureSchema();
  if (j.id) {
    await sql`
      UPDATE client_jobs SET
        agency_id=${j.agencyId ?? null}, agent_id=${j.agentId ?? null}, title=${j.title ?? null},
        area=${j.area ?? null}, leaflet_type=${j.leafletType ?? null}, quantity=${j.quantity ?? null},
        rate_per_leaflet=${j.ratePerLeaflet ?? null}, amount=${j.amount ?? null},
        status=${j.status ?? "to_send"}, invoice_status=${j.invoiceStatus ?? "not_sent"},
        invoice_no=${j.invoiceNo ?? null}, invoice_date=${j.invoiceDate ?? null},
        invoice_no_hidden=${j.invoiceNoHidden ?? false},
        picked_on=${j.pickedOn ?? null}, completed_on=${j.completedOn ?? null}, notes=${j.notes ?? null}
      WHERE id=${j.id};`;
    return j.id;
  }
  const r = await sql<{ id: number }>`
    INSERT INTO client_jobs
      (agency_id, agent_id, title, area, leaflet_type, quantity, rate_per_leaflet, amount,
       status, invoice_status, invoice_no, invoice_date, picked_on, completed_on, notes)
    VALUES
      (${j.agencyId ?? null}, ${j.agentId ?? null}, ${j.title ?? null}, ${j.area ?? null},
       ${j.leafletType ?? null}, ${j.quantity ?? null}, ${j.ratePerLeaflet ?? null}, ${j.amount ?? null},
       ${j.status ?? "to_send"}, ${j.invoiceStatus ?? "not_sent"}, ${j.invoiceNo ?? null},
       ${j.invoiceDate ?? null}, ${j.pickedOn ?? null}, ${j.completedOn ?? null}, ${j.notes ?? null})
    RETURNING id;`;
  return r.rows[0].id;
}
export async function deleteClientJob(id: number) {
  await ensureSchema();
  // Everything hanging off the job goes too, or it lingers on the worker's
  // dashboard and in their contracts with nothing behind it.
  await sql`DELETE FROM job_assignments WHERE job_id=${id};`;
  await sql`DELETE FROM job_interest WHERE job_id=${id};`;
  await sql`DELETE FROM job_contracts WHERE job_id=${id};`;
  await sql`UPDATE work_logs SET client_job_id = NULL WHERE client_job_id=${id};`;
  await sql`DELETE FROM client_jobs WHERE id=${id};`;
}

/* ------------------------ marketplace: interest & contracts ---------------- */

/** Published jobs with nobody assigned yet — what workers can put their hand up for. */
export async function listOpenJobs(): Promise<ClientJob[]> {
  await ensureSchema();
  return (await sql<ClientJob>`
    SELECT * FROM client_jobs
    WHERE published = TRUE AND assigned_user_id IS NULL
    ORDER BY created_at DESC LIMIT 100;`).rows;
}

export async function listJobsForWorker(userId: number): Promise<ClientJob[]> {
  await ensureSchema();
  return (await sql<ClientJob>`
    SELECT * FROM client_jobs WHERE assigned_user_id = ${userId}
    ORDER BY created_at DESC LIMIT 100;`).rows;
}

export async function listAssignments(): Promise<JobAssignment[]> {
  await ensureSchema();
  return (await sql<JobAssignment>`SELECT * FROM job_assignments ORDER BY job_id DESC, id ASC LIMIT 1000;`).rows;
}

export async function listAssignmentsForUser(userId: number): Promise<JobAssignment[]> {
  await ensureSchema();
  return (await sql<JobAssignment>`
    SELECT * FROM job_assignments WHERE user_id = ${userId} ORDER BY id DESC LIMIT 200;`).rows;
}

export async function upsertAssignment(a: {
  id?: number | null; jobId: number; userId: number; pay?: number | null;
  leafletShare?: number | null; areaNote?: string | null;
  startDate?: string | null; dueDate?: string | null; status?: string | null;
  minHours?: string | null; allocatedTime?: string | null; mapImage?: string | null;
  boundary?: string | null; mapCenter?: string | null;
}) {
  await ensureSchema();

  // With an id we're editing that exact row; without one it's a new
  // sub-contract, even if this worker already has one on the job.
  if (a.id) {
    const u = await sql<{ id: number }>`
      UPDATE job_assignments SET
        pay = ${a.pay ?? null}, leaflet_share = ${a.leafletShare ?? null},
        area_note = ${a.areaNote ?? null}, start_date = ${a.startDate || null},
        due_date = ${a.dueDate || null}, status = ${a.status || 'assigned'},
        min_hours = ${a.minHours ?? null}, allocated_time = ${a.allocatedTime ?? null},
        map_image = COALESCE(${a.mapImage ?? null}, map_image),
        boundary = COALESCE(${a.boundary ?? null}, boundary),
        map_center = COALESCE(${a.mapCenter ?? null}, map_center)
      WHERE id = ${a.id}
      RETURNING id;`;
    if (u.rows[0]) return u.rows[0].id;
  }

  const r = await sql<{ id: number }>`
    INSERT INTO job_assignments
      (job_id, user_id, pay, leaflet_share, area_note, start_date, due_date, status,
       min_hours, allocated_time, map_image, boundary, map_center)
    VALUES
      (${a.jobId}, ${a.userId}, ${a.pay ?? null}, ${a.leafletShare ?? null}, ${a.areaNote ?? null},
       ${a.startDate || null}, ${a.dueDate || null}, ${a.status || 'assigned'},
       ${a.minHours ?? null}, ${a.allocatedTime ?? null}, ${a.mapImage ?? null},
       ${a.boundary ?? null}, ${a.mapCenter ?? null})
    RETURNING id;`;
  return r.rows[0].id;
}

/** Accept one sub-contract. Each is taken on its own. */
export async function acceptAssignment(id: number, userId: number) {
  await ensureSchema();
  await sql`
    UPDATE job_assignments SET status = 'accepted'
     WHERE id = ${id} AND user_id = ${userId};`;
}

export async function deleteAssignment(id: number) {
  await ensureSchema();
  await sql`DELETE FROM job_assignments WHERE id = ${id};`;
}

/** Jobs a worker is on, whether via a sub-contract or the single-assignee field. */
export async function listJobsForWorkerAll(userId: number): Promise<ClientJob[]> {
  await ensureSchema();
  return (await sql<ClientJob>`
    SELECT DISTINCT j.* FROM client_jobs j
    LEFT JOIN job_assignments a ON a.job_id = j.id
    WHERE j.assigned_user_id = ${userId} OR a.user_id = ${userId}
    ORDER BY j.created_at DESC LIMIT 100;`).rows;
}

export async function listInterest(): Promise<JobInterest[]> {
  await ensureSchema();
  return (await sql<JobInterest>`SELECT * FROM job_interest ORDER BY created_at DESC LIMIT 500;`).rows;
}

export async function addInterest(jobId: number, userId: number, note?: string | null) {
  await ensureSchema();
  await sql`
    INSERT INTO job_interest (job_id, user_id, note) VALUES (${jobId}, ${userId}, ${note || null})
    ON CONFLICT (job_id, user_id) DO UPDATE SET note = EXCLUDED.note;`;
}

export async function removeInterest(jobId: number, userId: number) {
  await ensureSchema();
  await sql`DELETE FROM job_interest WHERE job_id = ${jobId} AND user_id = ${userId};`;
}

export async function assignJob(jobId: number, userId: number | null) {
  await ensureSchema();
  await sql`UPDATE client_jobs SET assigned_user_id = ${userId} WHERE id = ${jobId};`;
}

export async function setJobPublished(jobId: number, published: boolean) {
  await ensureSchema();
  await sql`UPDATE client_jobs SET published = ${published} WHERE id = ${jobId};`;
}

/**
 * Leaflets allocated to workers count as out for delivery, so "yet to be
 * dispatched" drops by the same amount. Recomputed from the sub-contracts each
 * time one changes, which keeps it right when a share is edited or removed.
 */
export async function syncJobOutCount(jobId: number) {
  await ensureSchema();
  // Delivered is what workers have logged; out for delivery is what's been
  // handed to them and not yet logged. Both stay editable by hand afterwards —
  // this only runs when a worker does something.
  await sql`
    UPDATE client_jobs j
       SET delivered_count = GREATEST(
             COALESCE((SELECT SUM(w.leaflet_count) FROM work_logs w WHERE w.client_job_id = j.id), 0),
             0
           ),
           out_count = GREATEST(
             0,
             COALESCE((SELECT SUM(a.leaflet_share) FROM job_assignments a WHERE a.job_id = j.id), 0)
               - COALESCE((SELECT SUM(w.leaflet_count) FROM work_logs w WHERE w.client_job_id = j.id), 0)
           )
     WHERE j.id = ${jobId};`;
}

/** Worker-facing job settings: pay, time, boundary and map. */
export async function setJobProgress(
  jobId: number, jobNumber: string | null, delivered: number | null, out: number | null,
) {
  await ensureSchema();
  await sql`
    UPDATE client_jobs SET job_number = ${jobNumber}, delivered_count = ${delivered}, out_count = ${out}
    WHERE id = ${jobId};`;
}

export async function setJobBrief(jobId: number, b: {
  workerPay?: number | null; allocatedTime?: string | null; minHours?: string | null;
  boundary?: string | null; mapCenter?: string | null; mapImage?: string | null;
}) {
  await ensureSchema();
  await sql`
    UPDATE client_jobs SET
      worker_pay = ${b.workerPay ?? null},
      allocated_time = ${b.allocatedTime ?? null},
      min_hours = ${b.minHours ?? null},
      boundary = ${b.boundary ?? null},
      map_center = ${b.mapCenter ?? null},
      map_image = ${b.mapImage ?? null}
    WHERE id = ${jobId};`;
}

export async function listContracts(): Promise<JobContract[]> {
  await ensureSchema();
  return (await sql<JobContract>`SELECT * FROM job_contracts ORDER BY created_at DESC LIMIT 500;`).rows;
}

export async function getContract(jobId: number, userId: number): Promise<JobContract | null> {
  await ensureSchema();
  return (await sql<JobContract>`
    SELECT * FROM job_contracts WHERE job_id=${jobId} AND user_id=${userId} LIMIT 1;`).rows[0] || null;
}

export async function saveContract(c: {
  jobId: number; userId: number; assignmentId?: number | null; signedName: string;
  signaturePng: string; signedDate: string; schedule?: string | null;
}) {
  await ensureSchema();
  // Keyed on the sub-contract, so a worker holding two on one job signs twice.
  if (c.assignmentId) {
    await sql`
      INSERT INTO job_contracts
        (job_id, user_id, assignment_id, signed_name, signature_png, signed_date, schedule, agreed)
      VALUES (${c.jobId}, ${c.userId}, ${c.assignmentId}, ${c.signedName}, ${c.signaturePng},
              ${c.signedDate}, ${c.schedule || null}, TRUE)
      ON CONFLICT (assignment_id) WHERE assignment_id IS NOT NULL DO UPDATE SET
        signed_name = EXCLUDED.signed_name, signature_png = EXCLUDED.signature_png,
        signed_date = EXCLUDED.signed_date, schedule = EXCLUDED.schedule, created_at = NOW();`;
    return;
  }
  // Older jobs with no sub-contract row keep one agreement for the job.
  const existing = await sql<{ id: number }>`
    SELECT id FROM job_contracts
     WHERE job_id = ${c.jobId} AND user_id = ${c.userId} AND assignment_id IS NULL LIMIT 1;`;
  if (existing.rows[0]) {
    await sql`
      UPDATE job_contracts SET signed_name = ${c.signedName}, signature_png = ${c.signaturePng},
        signed_date = ${c.signedDate}, schedule = ${c.schedule || null}, created_at = NOW()
       WHERE id = ${existing.rows[0].id};`;
    return;
  }
  await sql`
    INSERT INTO job_contracts (job_id, user_id, signed_name, signature_png, signed_date, schedule, agreed)
    VALUES (${c.jobId}, ${c.userId}, ${c.signedName}, ${c.signaturePng}, ${c.signedDate}, ${c.schedule || null}, TRUE);`;
}

/** Every agreement this worker has signed, newest first. */
export async function listContractsForUser(userId: number): Promise<JobContract[]> {
  await ensureSchema();
  return (await sql<JobContract>`
    SELECT * FROM job_contracts WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 200;`).rows;
}

export async function listAgencyPayments(): Promise<AgencyPayment[]> {
  await ensureSchema();
  return (await sql<AgencyPayment>`SELECT * FROM agency_payments ORDER BY COALESCE(paid_on, created_at::date) DESC, id DESC LIMIT 500;`).rows;
}
export async function addAgencyPayment(p: {
  agencyId: number; amount: number; paidOn?: string | null; method?: string | null; note?: string | null;
}) {
  await ensureSchema();
  const r = await sql<{ id: number }>`
    INSERT INTO agency_payments (agency_id, amount, paid_on, method, note)
    VALUES (${p.agencyId}, ${p.amount}, ${p.paidOn || null}, ${p.method || null}, ${p.note || null})
    RETURNING id;`;
  return r.rows[0].id;
}
export async function deleteAgencyPayment(id: number) {
  await ensureSchema();
  await sql`DELETE FROM agency_payments WHERE id=${id};`;
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
    SELECT id, full_name, name_key, bank_name, bank_bsb, bank_account, payid, area, notes, created_at
    FROM portal_users ORDER BY full_name ASC;
  `;
  return r.rows;
}

export async function deleteUser(id: number) {
  await ensureSchema();
  await sql`UPDATE work_logs SET user_id = NULL WHERE user_id = ${id};`;
  await sql`DELETE FROM payments WHERE user_id = ${id};`;
  await sql`DELETE FROM job_interest WHERE user_id = ${id};`;
  await sql`UPDATE client_jobs SET assigned_user_id = NULL WHERE assigned_user_id = ${id};`;
  await sql`DELETE FROM portal_users WHERE id = ${id};`;
}

export async function updateUserNotes(
  id: number, notes: string | null, area: string | null, fullName?: string | null,
) {
  await ensureSchema();
  const name = (fullName ?? "").trim();
  if (name) {
    // The sign-in key is derived from the name, so a rename has to move both or
    // they'd be locked out of the account.
    const key = nameKey(name);
    const clash = await sql<{ id: number }>`
      SELECT id FROM portal_users WHERE name_key = ${key} AND id <> ${id} LIMIT 1;`;
    if (clash.rows.length) throw new Error(`Someone is already on the register as "${name}".`);
    await sql`
      UPDATE portal_users SET notes = ${notes}, area = ${area}, full_name = ${name}, name_key = ${key}
       WHERE id = ${id};`;
    return;
  }
  await sql`UPDATE portal_users SET notes = ${notes}, area = ${area} WHERE id = ${id};`;
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
  clientJobId?: number | null;
  assignmentId?: number | null;
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
       leaflet_count, area_worked, client_job_id, assignment_id, strava_url, strava_urls, strava_status,
       strava_verified, mapmy_urls, notes)
    VALUES
      (${e.userId}, ${e.workerName}, ${e.jobNumber}, ${e.startedAt}, ${e.endedAt},
       ${e.timeSpent || null}, ${e.leafletCount ?? null}, ${e.areaWorked || null},
       ${e.clientJobId ?? null}, ${e.assignmentId ?? null}, ${e.stravaUrls[0] || null}, ${packLinks(e.stravaUrls)}, ${e.stravaStatus || null},
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

/** Office signs off on the tracking; only then is the shift owed. */
export async function setWorkLogVerified(id: number, verified: boolean) {
  await ensureSchema();
  if (verified) {
    await sql`UPDATE work_logs SET verified_at = COALESCE(verified_at, NOW()) WHERE id = ${id};`;
  } else {
    await sql`UPDATE work_logs SET verified_at = NULL WHERE id = ${id};`;
  }
}

/** Admin marks a job paid (or back to unpaid with null). Stamps the moment it was paid. */
export async function setWorkLogPaid(id: number, paidOn: string | null) {
  await ensureSchema();
  if (paidOn) {
    // Stamp the moment of payment only on the transition, so the recorded time doesn't drift.
    await sql`
      UPDATE work_logs
         SET paid_on = ${paidOn}, paid_at = COALESCE(paid_at, NOW())
       WHERE id = ${id};`;
  } else {
    await sql`UPDATE work_logs SET paid_on = NULL, paid_at = NULL WHERE id = ${id};`;
  }
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
