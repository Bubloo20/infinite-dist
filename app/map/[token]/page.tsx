"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import BoundaryMap, { parseSpec, specHasDrawing, type AreaSpec } from "@/components/portal/BoundaryMap";

const parseCenter = (s: string | null): [number, number, number] | null => {
  if (!s) return null;
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) && v.length === 3 ? (v as [number, number, number]) : null;
  } catch {
    return null;
  }
};

/**
 * A delivery area on a map, from a link.
 *
 * Shared with a worker before any of the paperwork — no account, no agreement,
 * nothing to accept. It shows the area and, once they allow it, where they are
 * inside it. The link itself is the credential, so this is deliberately the
 * whole of it: a shape and a name.
 */
export default function SharedMapPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"loading" | "ok" | "gone">("loading");
  const [title, setTitle] = useState("");
  const [spec, setSpec] = useState<AreaSpec | null>(null);
  const [center, setCenter] = useState<[number, number, number] | null>(null);
  const [junk, setJunk] = useState(false);
  const [error, setError] = useState("");

  // Asked for rather than sprung on them, so the browser prompt makes sense
  // when it appears.
  const [located, setLocated] = useState(false);
  const [height, setHeight] = useState(520);

  useEffect(() => {
    const fit = () => setHeight(Math.max(320, window.innerHeight - 164));
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
    };
  }, []);

  useEffect(() => {
    fetch(`/api/portal/map/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok) { setError(d.error || "That link isn't valid."); setState("gone"); return; }
        setTitle(d.title);
        setSpec(parseSpec(d.boundary));
        setCenter(parseCenter(d.mapCenter));
        setJunk(Boolean(d.junkMailAllowed));
        setState("ok");
      })
      .catch(() => { setError("Couldn't load that map."); setState("gone"); });
  }, [token]);

  if (state === "loading") {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-[#0b0713] text-white/50">
        Loading the map…
      </main>
    );
  }

  if (state === "gone" || !spec) {
    return (
      <main className="grid min-h-[100svh] place-items-center bg-[#0b0713] px-6 text-center">
        <div>
          <p className="font-display text-xl font-bold text-white">{error || "Map not found"}</p>
          <p className="mt-2 text-white/50">Ask the office for a new link.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100svh] bg-[#0b0713]">
      <div className="mx-auto w-full max-w-5xl px-3 py-4 sm:px-5">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">{title}</h1>
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${
            junk ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.08] text-white/50"}`}>
            {junk ? "Junk mail allowed" : "No junk mail"}
          </span>
        </div>

        {!located && (
          <button
            onClick={() => setLocated(true)}
            className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-orchid/40 bg-gradient-to-r from-electric/20 to-orchid/15 px-5 py-4 text-left transition hover:from-electric/30 hover:to-orchid/25"
          >
            <span>
              <span className="block font-display text-[15px] font-bold text-white">Show where I am</span>
              <span className="mt-0.5 block text-[13px] text-white/55">
                Your phone will ask to share your location — it stays on your phone.
              </span>
            </span>
            <span aria-hidden className="shrink-0 text-white/45">&rarr;</span>
          </button>
        )}

        {specHasDrawing(spec) ? (
          <BoundaryMap spec={spec} center={center} height={height} locate={located} />
        ) : (
          <div className="grid h-64 place-items-center rounded-2xl border border-white/12 bg-white/[0.03] text-white/45">
            No area has been drawn for this job yet.
          </div>
        )}

        <p className="mt-3 text-center text-[12px] text-white/30">Infinite Distribution</p>
      </div>
    </main>
  );
}
