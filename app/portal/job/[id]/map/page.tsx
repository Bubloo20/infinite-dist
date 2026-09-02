"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import BoundaryMap, { parseSpec, specHasDrawing, EMPTY_SPEC, type AreaSpec } from "@/components/portal/BoundaryMap";
import { Loading } from "@/components/portal/PortalShell";
import type { ClientJob, JobAssignment } from "@/lib/portal/db";

const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try { const v = JSON.parse(s); return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null; } catch { return null; }
};

/**
 * The delivery area, filling the screen.
 *
 * A page rather than an overlay: Leaflet binds to the element it was given, so
 * moving that element into a portal detaches the map, and a card on the job
 * page uses backdrop-blur, which traps `position: fixed` inside it. Its own
 * route avoids both, and Back is a real navigation.
 */
export default function JobMapPage() {
  const { id } = useParams<{ id: string }>();
  const assignmentId = Number(id);

  const [spec, setSpec] = useState<AreaSpec>(EMPTY_SPEC);
  const [center, setCenter] = useState<[number, number, number] | null>(null);
  const [title, setTitle] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [height, setHeight] = useState(600);
  const [state, setState] = useState<"loading" | "ok" | "gone">("loading");

  // Fill the window, and follow it when the phone rotates.
  useEffect(() => {
    const fit = () => setHeight(window.innerHeight - 64);
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  useEffect(() => {
    fetch("/api/portal/jobs")
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setState("gone"); return; }
        const a = (d.assignments || []).find((x: JobAssignment) => x.id === assignmentId) ?? null;
        const j = (d.mine || []).find((x: ClientJob) => x.id === a?.job_id) ?? null;
        if (!a || !j) { setState("gone"); return; }
        const own = parseSpec(a.boundary);
        setSpec(specHasDrawing(own) ? own : parseSpec(j.boundary));
        setCenter(parseCenter(a.map_center ?? j.map_center));
        setTitle(a.title?.trim() || a.area_note?.trim() || j.area?.trim() || `Job #${j.id}`);
        // Their position is only checked against the area once the work is
        // theirs — before that it's a job they're still deciding about.
        setAccepted(a.status === "accepted" ||
          (d.contracts || []).some((c: { assignmentId: number | null }) => c.assignmentId === a.id));
        setState("ok");
      })
      .catch(() => setState("gone"));
  }, [assignmentId]);

  return (
    <main className="min-h-[100svh] bg-[#0b0b0b]">
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <Link
          href={`/portal/job/${assignmentId}`}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 font-display text-[14px] font-bold text-white transition hover:bg-white/[0.12]"
        >
          ← Back
        </Link>
        <p className="min-w-0 truncate text-right text-[13px] font-semibold text-white/55">{title}</p>
      </div>

      {state === "loading" ? (
        <div className="grid h-[70svh] place-items-center"><Loading label="Your area" /></div>
      ) : state === "gone" ? (
        <div className="grid h-[70svh] place-items-center px-6 text-center">
          <div>
            <p className="font-display text-lg font-bold text-white">This area isn&apos;t available</p>
            <Link href="/portal" className="mt-3 inline-block text-sm font-semibold text-orchid">Back to your work</Link>
          </div>
        </div>
      ) : (
        <div className="px-2 pb-2">
          <BoundaryMap spec={spec} center={center} height={height} locate={accepted} />
        </div>
      )}
    </main>
  );
}
