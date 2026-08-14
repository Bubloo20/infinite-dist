/**
 * Import the historical job blocks from "Infinite distributions ledger.xlsx".
 *
 *   node scripts/import-ledger-history.mjs --dry          # print what it found
 *   node --env-file=.env.local scripts/import-ledger-history.mjs   # write to the DB
 *
 * Each block is: a job header row (description + revenue in column D),
 * then one row per worker paid (column C), then a "Profit" row.
 */
import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import os from "os";

const XLSX = String.raw`C:\Users\Bublo\Downloads\Infinite distributions ledger.xlsx`;
const DRY = process.argv.includes("--dry");

/* ------------------------------ read the sheet ----------------------------- */

function readRows() {
  const tmp = path.join(os.tmpdir(), "claude", "ledger-import");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.copyFileSync(XLSX, path.join(tmp, "l.zip"));
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${path.join(tmp, "l.zip")}' -DestinationPath '${path.join(tmp, "x")}' -Force"`,
    { stdio: "ignore" },
  );
  const base = path.join(tmp, "x", "xl");
  const ssXml = fs.readFileSync(path.join(base, "sharedStrings.xml"), "utf8");
  const strings = [...ssXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
      .map((t) => t[1]).join("")
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
  );
  const sheet = fs.readFileSync(path.join(base, "worksheets", "sheet1.xml"), "utf8");
  return [...sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map((r) => {
    const cells = {};
    for (const c of r[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
      const v = (c[3].match(/<v>([\s\S]*?)<\/v>/) || [])[1];
      const inline = (c[3].match(/<t[^>]*>([\s\S]*?)<\/t>/) || [])[1];
      const isStr = /t="s"/.test(c[2]);
      const val = /t="inlineStr"/.test(c[2]) ? inline || "" : v === undefined ? "" : isStr ? strings[+v] : v;
      if (String(val).trim() !== "") cells[c[1]] = String(val).trim();
    }
    return { row: +r[1], ...cells };
  });
}

/* -------------------------------- parsing --------------------------------- */

const AGENCY_PATTERNS = [
  [/vicprop/i, "Vicprop"],
  [/nelson\s*a|nelsona|nunzio|bella|isabella|tyler/i, "Nelson Alexander"],
  [/collings/i, "Collings"],
  [/woodards/i, "Woodards"],
  [/lewis/i, "Lewis Real Estate"],
  [/mark plumber/i, "Mark Plumber"],
];

const agencyFor = (text) => (AGENCY_PATTERNS.find(([re]) => re.test(text)) || [])[1] || null;

/**
 * "70+15" and "35 +17" are split payments. Anything containing letters is a
 * label, not a number — the ledger has text in money columns on joint rows
 * (e.g. D = "Woodards 1000 12/3 @0.13"), which must never parse as currency.
 */
function sumAmount(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (/[a-z]/i.test(s)) return null;
  if (!/^[\d.\s+$]+$/.test(s)) return null;
  const cleaned = s.replace(/[^0-9.+]/g, "");
  if (!cleaned) return null;
  const parts = cleaned.split("+").filter(Boolean);
  if (parts.some((p) => (p.match(/\./g) || []).length > 1)) return null;
  const total = parts.reduce((t, p) => t + (parseFloat(p) || 0), 0);
  if (!Number.isFinite(total) || total <= 0 || total > 100000) return null;
  return Math.round(total * 100) / 100;
}

/** Street/area lines and running notes sit in the same column as worker names. */
const NOT_A_PERSON =
  /\b(rd|road|street|st|cres|crescent|pde|parade|ave|avenue|court|ct|drive|dr|lane|ln|way|place|pl|terrace|magnets?|referral|refferal|referal|profit|collings|vicprop|nelson|woodards|lewis|total|overall|macloed|macleod|rosanna|viewbank|heidelberg|ivanhoe|northcote|thornbury|bellfield|doncaster|manningham)\b/i;

function cleanWorkerName(raw) {
  let name = String(raw).split(/\s*[-–]\s*/)[0];
  name = name.replace(/\b\d+\b/g, "").replace(/[+=:().]/g, " ").replace(/\s+/g, " ").trim();
  if (!name) return null;
  if (!/[a-z]{2,}/i.test(name)) return null;
  if (NOT_A_PERSON.test(name)) return null;
  if (name.split(" ").length > 3) return null;
  if (/^(paid|not|unpaid|done|picked|pay|check|dispute)$/i.test(name)) return null;
  // Trailing status words: "tom paid" -> "tom", "Kaya not paid" -> "Kaya"
  name = name.replace(/\s+(not\s+)?paid$/i, "").replace(/\s+dispute$/i, "").trim();
  return name || null;
}

/** "not paid" / "unpaid" must win over a bare "paid" substring. */
function paidState(text) {
  const t = String(text);
  if (/\b(not\s*paid|unpaid|owing|owes)\b/i.test(t)) return { paid: false, disputed: false };
  if (/dispute/i.test(t)) return { paid: false, disputed: true };
  if (/\bpaid\b/i.test(t)) return { paid: true, disputed: false };
  return { paid: false, disputed: false };
}

function parseQtyRate(desc) {
  const rate = (desc.match(/@\s*\$?\s*(0?\.\d+)/) || [])[1];
  // Largest number that looks like a leaflet count.
  const nums = [...desc.matchAll(/\b(\d{3,6})\b/g)].map((m) => +m[1]).filter((n) => n >= 100);
  return { quantity: nums.length ? Math.max(...nums) : null, rate: rate ? parseFloat(rate) : null };
}

/** "Proft" / "profit:" are typos for the block terminator. */
const isProfitRow = (b) => /^\s*(overall\s+)?(profit|proft)\s*:?\s*$/i.test(b || "");

function parse(rows) {
  const jobs = [];
  let current = null;

  for (const r of rows) {
    const A = r.A || "", B = r.B || "", C = r.C, D = r.D;
    if (!B && !D) continue;
    if (r.row <= 1) continue;
    if (/^(cost|revenue|workforce|area)/i.test(B)) continue;

    if (isProfitRow(B)) {
      if (current) { current.profit = sumAmount(D); jobs.push(current); current = null; }
      continue;
    }

    /**
     * Column position decides the row type, not the wording — job titles often
     * contain " - " (e.g. "D' Vicprop - 3000") and would otherwise look like
     * worker lines.
     *   header      -> revenue in D (occasionally C), cost column empty
     *   worker line -> cost in C, no revenue in D
     */
    const dAmt = sumAmount(D);
    const cAmt = sumAmount(C);
    const revenue = dAmt !== null ? dAmt : B && cAmt !== null && !current ? cAmt : null;
    const isHeader = revenue !== null && (dAmt !== null ? cAmt === null : true);

    if (isHeader) {
      if (current) jobs.push(current);
      const { quantity, rate } = parseQtyRate(B);
      current = {
        row: r.row, description: B || `Ledger job (row ${r.row})`, agency: agencyFor(B),
        revenue, quantity, rate, invoiceHint: A, workers: [],
      };
      continue;
    }

    if (current && B && sumAmount(C) !== null) {
      const name = cleanWorkerName(B);
      const state = paidState(B);
      if (name && state.disputed) {
        // Disputed lines were never paid and are not an expense — drop them.
        current.disputed = current.disputed || [];
        current.disputed.push(`${name} ($${sumAmount(C)})`);
      } else if (name) {
        current.workers.push({ raw: B, name, amount: sumAmount(C), ...state });
      } else {
        current.skipped = current.skipped || [];
        current.skipped.push(`${B} ($${C})`);
      }
    }
  }
  if (current) jobs.push(current);
  return jobs.filter((j) => j.revenue !== null || j.workers.length);
}

/* --------------------------------- report --------------------------------- */

const rows = readRows();
const jobs = parse(rows);

const totalRevenue = jobs.reduce((t, j) => t + (j.revenue || 0), 0);
const totalLabour = jobs.reduce((t, j) => t + j.workers.reduce((s, w) => s + (w.amount || 0), 0), 0);
const byWorker = {};
for (const j of jobs) for (const w of j.workers) {
  const k = w.name.toLowerCase();
  byWorker[k] = byWorker[k] || { name: w.name, total: 0, jobs: 0, unpaid: 0 };
  byWorker[k].total += w.amount || 0;
  byWorker[k].jobs += 1;
  if (!w.paid) byWorker[k].unpaid += w.amount || 0;
}

if (DRY) {
  console.log(`JOBS PARSED: ${jobs.length}`);
  console.log(`Revenue total: $${totalRevenue.toFixed(2)}   Labour total: $${totalLabour.toFixed(2)}   Margin: $${(totalRevenue - totalLabour).toFixed(2)}\n`);
  for (const j of jobs) {
    console.log(`r${j.row} | ${j.agency || "??"} | $${(j.revenue ?? 0).toFixed(2)} | qty ${j.quantity ?? "-"} @ ${j.rate ?? "-"} | ${j.description.slice(0, 58)}`);
    for (const w of j.workers) console.log(`      ${w.paid ? "PAID  " : w.disputed ? "DISPUTE" : "UNPAID"} ${w.name.padEnd(14)} $${(w.amount ?? 0).toFixed(2)}`);
  }
  console.log("\nPER WORKER:");
  Object.values(byWorker).sort((a, b) => b.total - a.total)
    .forEach((w) => console.log(`  ${w.name.padEnd(16)} ${String(w.jobs).padStart(3)} jobs  $${w.total.toFixed(2)}${w.unpaid ? `  (unpaid $${w.unpaid.toFixed(2)})` : ""}`));
  process.exit(0);
}

/* --------------------------------- import --------------------------------- */

const { sql } = await import("@vercel/postgres");
const nameKey = (s) => s.trim().toLowerCase().replace(/\s+/g, " ");

const agencyIds = {};
for (const a of (await sql`SELECT id, name FROM agencies;`).rows) agencyIds[a.name.toLowerCase()] = a.id;

const userIds = {};
for (const u of (await sql`SELECT id, full_name, name_key FROM portal_users;`).rows) userIds[u.name_key] = u.id;

/** Ledger short names -> the seeded account names. */
const ALIASES = {
  tom: "tom makin", "tom m": "tom makin", thomas: "thomas", kai: "kai evans",
  ugo: "ugo aboh", daniel: "daniel r", jullian: "jullian", mohammed: "muhammed",
  muhammed: "muhammed", ollie: "ollie", oliie: "ollie", noah: "noah",
  "noah jhonson": "noah johnson", jacob: "jacob smith", "jacob smith": "jacob smith",
  ash: "ash", reece: "reece", andrew: "andrew", oscar: "oscar", mickey: "mickey",
  seth: "seth", sylvie: "sylvie", luke: "luke", harry: "harry", jaden: "jaden", abdi: "abdi",
};

async function userIdFor(name) {
  const k = nameKey(name);
  const target = ALIASES[k] || k;
  if (userIds[target]) return userIds[target];
  const r = await sql`INSERT INTO portal_users (full_name, name_key, password_hash)
    VALUES (${name}, ${target}, ${"imported:no-login"}) RETURNING id;`;
  userIds[target] = r.rows[0].id;
  return r.rows[0].id;
}

let jobsAdded = 0, earningsAdded = 0;
for (const j of jobs) {
  const agencyId = j.agency ? agencyIds[j.agency.toLowerCase()] ?? null : null;
  const invoiceStatus = /not sent/i.test(j.invoiceHint) ? "not_sent" : /paid/i.test(j.invoiceHint) ? "received" : "sent";

  const exists = await sql`SELECT id FROM client_jobs WHERE notes = ${"ledger:r" + j.row} LIMIT 1;`;
  if (!exists.rows[0]) {
    await sql`
      INSERT INTO client_jobs (agency_id, title, quantity, rate_per_leaflet, amount, status, invoice_status, notes)
      VALUES (${agencyId}, ${j.description.slice(0, 200)}, ${j.quantity}, ${j.rate}, ${j.revenue},
              'completed', ${invoiceStatus}, ${"ledger:r" + j.row});`;
    jobsAdded++;
  }

  for (const [idx, w] of j.workers.entries()) {
    if (!w.amount) continue;
    const uid = await userIdFor(w.name);
    // Index included: the same worker can be paid more than once in one block.
    const tag = `ledger:r${j.row}:${idx}:${nameKey(w.name)}`;
    const dup = await sql`SELECT id FROM work_logs WHERE notes = ${tag} LIMIT 1;`;
    if (dup.rows[0]) continue;
    await sql`
      INSERT INTO work_logs (user_id, worker_name, job_number, started_at, ended_at, amount, paid_on, notes, strava_urls)
      VALUES (${uid}, ${w.name}, ${"LEDGER-" + j.row}, '', '', ${w.amount},
              ${w.paid ? "2026-06-30" : null}, ${tag}, '[]');`;
    earningsAdded++;
  }
}

console.log(JSON.stringify({ jobsAdded, earningsAdded, parsedJobs: jobs.length }, null, 2));
