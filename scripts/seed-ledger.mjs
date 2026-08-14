/**
 * One-off seed from "Infinite distributions ledger.xlsx".
 * Idempotent: skips any agency/agent/worker that already exists.
 *
 *   node --env-file=.env.local scripts/seed-ledger.mjs
 */
import { sql } from "@vercel/postgres";
import crypto from "crypto";

const AGENCIES = [
  { name: "Vicprop", rate: 0.13, agents: ["D'Vicprop", "Doncaster"] },
  { name: "Nelson Alexander", rate: 0.13, agents: ["Nunzio", "Isabella (Bella)", "Tyler", "Mark", "Fransesca"] },
  { name: "Collings", rate: 0.11, agents: [] },
  { name: "Woodards", rate: 0.13, agents: [] },
  { name: "Lewis Real Estate", rate: 0.13, agents: [] },
  { name: "Mark Plumber", rate: null, agents: [] },
];

// Column I "WORKFORCE" plus every name that appears in a payment line.
const WORKERS = [
  { name: "Jullian", area: "Heidelberg, Ivanhoe" },
  { name: "Tom Makin", area: "Local, Manningham" },
  { name: "Ash", area: "Local, Manningham, Rosanna, Viewbank, Macleod" },
  { name: "Kai Evans", area: "Local, Viewbank, Manningham" },
  { name: "Daniel R", area: "Local + anywhere, Manningham" },
  { name: "Ugo Aboh", area: "Local, Heidelberg" },
  { name: "Andrew", area: "Local" },
  { name: "Noah", area: "Camberwell, Glen Iris, Kew, Balwyn" },
  { name: "Reece", area: "Local, Manningham" },
  { name: "Abdi", area: "" },
  { name: "Muhammed", area: "" },
  { name: "Oscar", area: "" },
  { name: "Ollie", area: "" },
  { name: "Jacob Smith", area: "" },
  { name: "Mickey", area: "" },
  { name: "Seth", area: "" },
  { name: "Sylvie", area: "" },
  { name: "Luke", area: "" },
  { name: "Thomas", area: "" },
  { name: "Harry", area: "" },
  { name: "Noah Johnson", area: "" },
];

const nameKey = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

/** Same scrypt format the portal uses, so these accounts can sign in. */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}

async function main() {
  let addedAgencies = 0, addedAgents = 0, addedWorkers = 0;

  for (const a of AGENCIES) {
    const found = await sql`SELECT id FROM agencies WHERE lower(name)=${a.name.toLowerCase()} LIMIT 1;`;
    let id = found.rows[0]?.id;
    if (!id) {
      const r = await sql`INSERT INTO agencies (name, price_per_leaflet) VALUES (${a.name}, ${a.rate}) RETURNING id;`;
      id = r.rows[0].id;
      addedAgencies++;
    }
    for (const g of a.agents) {
      const ex = await sql`SELECT id FROM agents WHERE agency_id=${id} AND lower(name)=${g.toLowerCase()} LIMIT 1;`;
      if (!ex.rows[0]) {
        await sql`INSERT INTO agents (agency_id, name) VALUES (${id}, ${g});`;
        addedAgents++;
      }
    }
  }

  for (const w of WORKERS) {
    const key = nameKey(w.name);
    const ex = await sql`SELECT id FROM portal_users WHERE name_key=${key} LIMIT 1;`;
    if (!ex.rows[0]) {
      // Placeholder password — each worker resets it by registering with the team password.
      await sql`
        INSERT INTO portal_users (full_name, name_key, password_hash, area)
        VALUES (${w.name}, ${key}, ${hashPassword("infinite")}, ${w.area || null});`;
      addedWorkers++;
    }
  }

  const counts = async (t) => (await sql.query(`SELECT count(*)::int n FROM ${t}`)).rows[0].n;
  console.log(JSON.stringify({
    addedAgencies, addedAgents, addedWorkers,
    totals: {
      agencies: await counts("agencies"),
      agents: await counts("agents"),
      workers: await counts("portal_users"),
    },
  }, null, 2));
}

main().catch((e) => { console.error("SEED FAILED:", e.message); process.exit(1); });
