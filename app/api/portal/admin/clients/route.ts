import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/portal/auth";
import {
  listAgencies, upsertAgency, deleteAgency,
  listAgents, upsertAgent, deleteAgent,
  listClientJobs, upsertClientJob, deleteClientJob,
  assignJob, setJobPublished, setJobBrief, setJobProgress,
  listAgencyPayments, addAgencyPayment, deleteAgencyPayment, listInterest,
  listAssignments, upsertAssignment, deleteAssignment,
  dbConfigured,
} from "@/lib/portal/db";

export const dynamic = "force-dynamic";

const n = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isFinite(x) ? x : null;
};

/** Everything the Clients/Jobs tabs need. */
export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ ok: true, dbConfigured: false, agencies: [], agents: [], jobs: [], agencyPayments: [] });
  try {
    const [agencies, agents, jobs, agencyPayments, interest, assignments] = await Promise.all([
      listAgencies(), listAgents(), listClientJobs(), listAgencyPayments(), listInterest(), listAssignments(),
    ]);
    return NextResponse.json({ ok: true, dbConfigured: true, agencies, agents, jobs, agencyPayments, interest, assignments });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Query failed." }, { status: 500 });
  }
}

/** One endpoint, switched by `entity`, so the dashboard has a single place to post. */
export async function POST(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });

  let b: Record<string, unknown> & { entity?: string };
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  try {
    switch (b.entity) {
      case "agency": {
        const name = String(b.name || "").trim();
        if (!name) return NextResponse.json({ ok: false, error: "Agency name is required." }, { status: 400 });
        const id = await upsertAgency({
          id: n(b.id), name, pricePerLeaflet: n(b.pricePerLeaflet),
          email: (b.email as string) || null, phone: (b.phone as string) || null,
          address: (b.address as string) || null, notes: (b.notes as string) || null,
        });
        return NextResponse.json({ ok: true, id });
      }
      case "agent": {
        const name = String(b.name || "").trim();
        const agencyId = n(b.agencyId);
        if (!name || !agencyId) return NextResponse.json({ ok: false, error: "Agent name and agency are required." }, { status: 400 });
        const id = await upsertAgent({
          id: n(b.id), agencyId, name,
          email: (b.email as string) || null, phone: (b.phone as string) || null, notes: (b.notes as string) || null,
        });
        return NextResponse.json({ ok: true, id });
      }
      case "job": {
        const qty = n(b.quantity);
        const rate = n(b.ratePerLeaflet);
        // Amount falls back to quantity x rate when not given explicitly.
        const amount = n(b.amount) ?? (qty !== null && rate !== null ? Math.round(qty * rate * 100) / 100 : null);
        const id = await upsertClientJob({
          id: n(b.id), agencyId: n(b.agencyId), agentId: n(b.agentId),
          title: (b.title as string) || null, area: (b.area as string) || null,
          leafletType: (b.leafletType as string) || null,
          quantity: qty, ratePerLeaflet: rate, amount,
          status: (b.status as "to_send" | "out_for_delivery" | "completed") || "to_send",
          invoiceStatus: (b.invoiceStatus as "not_sent" | "sent" | "received") || "not_sent",
          invoiceNo: (b.invoiceNo as string) || null, invoiceDate: (b.invoiceDate as string) || null,
          pickedOn: (b.pickedOn as string) || null, completedOn: (b.completedOn as string) || null,
          notes: (b.notes as string) || null,
        });
        if (b.jobNumber !== undefined || b.deliveredCount !== undefined || b.outCount !== undefined) {
          await setJobProgress(id, (b.jobNumber as string) || null, n(b.deliveredCount), n(b.outCount));
        }
        // Marketplace extras: assignment, publishing, worker brief and boundary.
        if (b.assignedUserId !== undefined) await assignJob(id, n(b.assignedUserId));
        if (b.published !== undefined) await setJobPublished(id, Boolean(b.published));
        if (b.workerPay !== undefined || b.allocatedTime !== undefined || b.minHours !== undefined || b.boundary !== undefined) {
          await setJobBrief(id, {
            workerPay: n(b.workerPay),
            allocatedTime: (b.allocatedTime as string) || null,
            minHours: (b.minHours as string) || null,
            boundary: (b.boundary as string) || null,
            mapCenter: (b.mapCenter as string) || null,
            mapImage: (b.mapImage as string) || null,
          });
        }
        return NextResponse.json({ ok: true, id });
      }
      case "assignment": {
        const jobId = n(b.jobId);
        const userId = n(b.userId);
        if (!jobId || !userId) return NextResponse.json({ ok: false, error: "Job and worker are required." }, { status: 400 });
        const id = await upsertAssignment({
          jobId, userId, pay: n(b.pay), leafletShare: n(b.leafletShare),
          areaNote: (b.areaNote as string) || null,
          startDate: (b.startDate as string) || null, dueDate: (b.dueDate as string) || null,
          status: (b.status as string) || "assigned",
        });
        return NextResponse.json({ ok: true, id });
      }
      case "agencyPayment": {
        const agencyId = n(b.agencyId);
        const amount = n(b.amount);
        if (!agencyId || amount === null || amount <= 0) {
          return NextResponse.json({ ok: false, error: "Agency and amount are required." }, { status: 400 });
        }
        const id = await addAgencyPayment({
          agencyId, amount,
          paidOn: (b.paidOn as string) || new Date().toISOString().slice(0, 10),
          method: (b.method as string) || null, note: (b.note as string) || null,
        });
        return NextResponse.json({ ok: true, id });
      }
      default:
        return NextResponse.json({ ok: false, error: "Unknown entity." }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Save failed." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!isAdmin()) return NextResponse.json({ ok: false, error: "Admin access required." }, { status: 401 });
  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const id = Number(url.searchParams.get("id"));
  if (!id) return NextResponse.json({ ok: false, error: "Missing id." }, { status: 400 });
  try {
    if (entity === "agency") await deleteAgency(id);
    else if (entity === "agent") await deleteAgent(id);
    else if (entity === "job") await deleteClientJob(id);
    else if (entity === "agencyPayment") await deleteAgencyPayment(id);
    else if (entity === "assignment") await deleteAssignment(id);
    else return NextResponse.json({ ok: false, error: "Unknown entity." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : "Delete failed." }, { status: 500 });
  }
}
