"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GlassCard } from "./PortalShell";
import { insideBoundary, distanceToArea, type AreaSpec, type LatLng } from "./BoundaryMap";

type Fix = { lat: number; lng: number; accuracy: number | null; speed: number | null; at: string; gap: boolean };

/** Points closer together than this are the GPS jittering, not walking. */
const MIN_STEP_M = 6;
/**
 * How far outside the area we'll still call "here". GPS is routinely out by
 * 10-30 m in a suburb, and a worker legitimately starts at the kerb, so the
 * device's own accuracy figure is added to this before turning anyone away.
 */
const START_MARGIN_M = 75;
/** A silence longer than this means the phone slept — break the trail there. */
const GAP_MS = 45_000;
const FLUSH_MS = 20_000;
const BUFFER_KEY = "idp_track_buffer";

function metres(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

const clock = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
};

/**
 * Timing a shift and checking the worker is where the job is.
 *
 * A browser can't track with the screen locked — Safari suspends the page, and
 * no amount of code changes that. So this keeps the screen awake while it runs,
 * saves every fix locally before sending it, and when the phone does go quiet
 * it marks the break rather than drawing a straight line across it and
 * pretending it saw the walk.
 */
export default function JobTracker({
  assignmentId, spec, onFinished,
}: {
  assignmentId: number;
  /** The area the office drew — what "in bounds" is measured against. */
  spec: AreaSpec;
  onFinished?: () => void;
}) {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "running" | "paused" | "finished">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [inside, setInside] = useState<boolean | null>(null);
  const [counts, setCounts] = useState({ inside: 0, outside: 0 });
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [awake, setAwake] = useState(false);
  const [slept, setSlept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [endedAt, setEndedAt] = useState<string | null>(null);
  const [checking, setChecking] = useState("");

  const watchRef = useRef<number | null>(null);
  const bufferRef = useRef<Fix[]>([]);
  const lastRef = useRef<{ pt: LatLng; at: number } | null>(null);
  const startedRef = useRef<number>(0);
  const bankedRef = useRef<number>(0);
  const totalsRef = useRef({ distanceM: 0, movingMs: 0, inside: 0, outside: 0 });
  const wakeRef = useRef<WakeLockSentinel | null>(null);
  const sessionRef = useRef<number | null>(null);

  const area = spec.mode === "area" ? spec.shapes[0] || [] : [];
  const canJudge = area.length >= 3;

  /** Send whatever's buffered; keep it if the send fails so nothing is lost. */
  const flush = useCallback(async () => {
    const id = sessionRef.current;
    if (!id || !bufferRef.current.length) return;
    const batch = bufferRef.current.slice();
    try {
      const r = await fetch("/api/portal/me/track", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "points", sessionId: id, points: batch, totals: totalsRef.current }),
      });
      if ((await r.json()).ok) {
        bufferRef.current = bufferRef.current.slice(batch.length);
        try { localStorage.setItem(BUFFER_KEY, JSON.stringify(bufferRef.current)); } catch {}
      }
    } catch {
      /* offline — the buffer keeps them until the next attempt */
    }
  }, []);

  const record = useCallback((pos: GeolocationPosition) => {
    const now = Date.now();
    const pt: LatLng = [pos.coords.latitude, pos.coords.longitude];
    const last = lastRef.current;
    const gap = Boolean(last && now - last.at > GAP_MS);
    if (gap) setSlept(true);

    if (last && !gap) {
      const step = metres(last.pt, pt);
      // Ignore GPS jitter while standing still, or it invents distance.
      if (step >= MIN_STEP_M) {
        totalsRef.current.distanceM += step;
        totalsRef.current.movingMs += now - last.at;
        setDistance(Math.round(totalsRef.current.distanceM));
      }
    }

    if (canJudge) {
      const isIn = insideBoundary(pt, area);
      setInside(isIn);
      if (isIn) totalsRef.current.inside += 1; else totalsRef.current.outside += 1;
      setCounts({ inside: totalsRef.current.inside, outside: totalsRef.current.outside });
    }

    setAccuracy(pos.coords.accuracy ?? null);
    lastRef.current = { pt, at: now };
    bufferRef.current.push({
      lat: pt[0], lng: pt[1],
      accuracy: pos.coords.accuracy ?? null,
      speed: pos.coords.speed ?? null,
      at: new Date(now).toISOString(),
      gap,
    });
    try { localStorage.setItem(BUFFER_KEY, JSON.stringify(bufferRef.current)); } catch {}
  }, [area, canJudge]);

  const watch = useCallback(() => {
    if (!("geolocation" in navigator)) { setErr("This device can't share its location."); return; }
    if (watchRef.current !== null) return;
    watchRef.current = navigator.geolocation.watchPosition(
      record,
      (e) => setErr(
        e.code === e.PERMISSION_DENIED
          ? "Location is blocked. Allow it for this site, then start again."
          : "Couldn't read your location just now — still trying.",
      ),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
  }, [record]);

  const unwatch = useCallback(() => {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  /** Hold the screen awake — the only real defence against the page being suspended. */
  const holdAwake = useCallback(async () => {
    try {
      const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockSentinel> } };
      if (!nav.wakeLock) return;
      wakeRef.current = await nav.wakeLock.request("screen");
      setAwake(true);
      wakeRef.current.addEventListener("release", () => setAwake(false));
    } catch {
      setAwake(false);
    }
  }, []);

  const dropAwake = useCallback(() => {
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
    setAwake(false);
  }, []);

  // Pick up a walk already in progress — a refresh shouldn't lose it.
  useEffect(() => {
    fetch(`/api/portal/me/track?assignmentId=${assignmentId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.ok || !d.session) return;
        const s = d.session;
        if (s.status === "finished") { setStatus("finished"); setElapsed(0); return; }
        sessionRef.current = s.id;
        setSessionId(s.id);
        totalsRef.current = {
          distanceM: s.distance_m || 0, movingMs: s.moving_ms || 0,
          inside: s.inside_count || 0, outside: s.outside_count || 0,
        };
        setDistance(s.distance_m || 0);
        setCounts({ inside: s.inside_count || 0, outside: s.outside_count || 0 });
        bankedRef.current = Date.now() - new Date(s.started_at).getTime();
        startedRef.current = Date.now();
        setStartedAt(s.started_at);
        setEndedAt(s.ended_at);
        setStatus(s.status === "paused" ? "paused" : "running");
        if (s.status !== "paused") { watch(); holdAwake(); }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentId]);

  // The clock, and a regular send.
  useEffect(() => {
    if (status !== "running") return;
    const tick = setInterval(() => setElapsed(bankedRef.current + (Date.now() - startedRef.current)), 1000);
    const send = setInterval(flush, FLUSH_MS);
    return () => { clearInterval(tick); clearInterval(send); };
  }, [status, flush]);

  // Coming back after the phone slept: send what we have and re-acquire.
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState !== "visible" || status !== "running") return;
      flush();
      if (wakeRef.current === null) holdAwake();
    };
    document.addEventListener("visibilitychange", wake);
    return () => document.removeEventListener("visibilitychange", wake);
  }, [status, flush, holdAwake]);

  useEffect(() => () => { unwatch(); dropAwake(); }, [unwatch, dropAwake]);

  const post = async (action: string, extra: Record<string, unknown> = {}) => {
    const r = await fetch("/api/portal/me/track", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, sessionId: sessionRef.current, ...extra }),
    });
    return r.json();
  };

  /** One fix, now — used to check they're actually at the job before starting. */
  const fixNow = () =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      if (!("geolocation" in navigator)) { reject(new Error("This device can't share its location.")); return; }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true, maximumAge: 0, timeout: 20000,
      });
    });

  const start = async () => {
    setBusy(true); setErr("");
    try {
      // Be at the job before the clock starts.
      if (canJudge) {
        setChecking("Checking you're at the job…");
        try {
          const pos = await fixNow();
          const here: LatLng = [pos.coords.latitude, pos.coords.longitude];
          const away = distanceToArea(here, area);
          const allowed = START_MARGIN_M + (pos.coords.accuracy || 0);
          if (away > allowed) {
            setErr(
              `You're about ${Math.round(away)} m from your delivery area, so the shift hasn't started. ` +
              `Head to the area and try again — your phone puts you within ±${Math.round(pos.coords.accuracy || 0)} m.`,
            );
            return;
          }
        } catch {
          setErr("Couldn't check where you are. Allow location for this site, then start again.");
          return;
        } finally {
          setChecking("");
        }
      }

      const d = await post("start", { assignmentId });
      if (!d.ok) { setErr(d.error || "Couldn't start."); return; }
      sessionRef.current = d.sessionId;
      setSessionId(d.sessionId);
      bufferRef.current = [];
      lastRef.current = null;
      totalsRef.current = { distanceM: 0, movingMs: 0, inside: 0, outside: 0 };
      bankedRef.current = 0;
      startedRef.current = Date.now();
      setDistance(0); setCounts({ inside: 0, outside: 0 }); setSlept(false); setElapsed(0);
      setStartedAt(new Date().toISOString());
      setEndedAt(null);
      setStatus("running");
      watch();
      holdAwake();
    } finally { setBusy(false); }
  };

  const pause = async () => {
    bankedRef.current += Date.now() - startedRef.current;
    setStatus("paused");
    unwatch(); dropAwake();
    await flush();
    await post("pause");
  };

  const resume = async () => {
    startedRef.current = Date.now();
    setStatus("running");
    watch(); holdAwake();
    await post("resume");
  };

  const finish = async () => {
    if (!window.confirm("Finish tracking this shift?")) return;
    bankedRef.current += status === "running" ? Date.now() - startedRef.current : 0;
    setEndedAt(new Date().toISOString());
    setStatus("finished");
    unwatch(); dropAwake();
    await flush();
    await post("finish");
    onFinished?.();
  };

  const checked = counts.inside + counts.outside;
  const share = checked ? Math.round((counts.inside / checked) * 100) : null;

  return (
    <GlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orchid">Shift tracking</p>
          <h3 className="mt-2 font-display text-xl font-extrabold tracking-tight text-white">
            {status === "running" ? "Tracking your shift"
              : status === "paused" ? "Paused"
              : status === "finished" ? "Shift tracked"
              : "Start your shift"}
          </h3>
        </div>
        {status !== "idle" && (
          <span className="font-display text-2xl font-extrabold tabular-nums text-white">{clock(elapsed)}</span>
        )}
      </div>

      {status !== "idle" && (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">Distance</p>
            <p className="mt-0.5 font-semibold text-white">
              {distance >= 1000 ? `${(distance / 1000).toFixed(2)} km` : `${distance} m`}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">In your area</p>
            <p className="mt-0.5 font-semibold text-white">{share === null ? "—" : `${share}%`}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-white/35">GPS accuracy</p>
            <p className="mt-0.5 font-semibold text-white">{accuracy === null ? "—" : `±${Math.round(accuracy)} m`}</p>
          </div>
        </div>
      )}

      {/* The live answer to the only question that matters while walking. */}
      {status === "running" && canJudge && inside !== null && (
        <div className={`mt-3 rounded-xl border px-4 py-3 ${
          inside ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                 : "border-rose-400/40 bg-rose-500/12 text-rose-200"}`}>
          <p className="font-display text-[15px] font-bold">
            {inside ? "You're inside your area" : "You've walked outside your area"}
          </p>
          <p className="mt-0.5 text-[13px] opacity-75">
            {inside ? "Keep going — this is the right patch."
                    : "Head back inside the boundary before you keep delivering."}
          </p>
        </div>
      )}

      {status === "running" && !canJudge && (
        <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[13px] text-white/50">
          No area was drawn for this job, so only your time is being recorded.
        </p>
      )}

      {status === "running" && !awake && (
        <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
          Keep this page open and your screen on. Tracking stops while the phone is locked.
        </p>
      )}

      {slept && (
        <p className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-200">
          There&apos;s a break in the recording — the phone went to sleep. Time still counted; the missing
          stretch is marked rather than guessed.
        </p>
      )}

      {(startedAt || endedAt) && (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-white/45">
          {startedAt && <span>Started {new Date(startedAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
          {endedAt && <span>Finished {new Date(endedAt).toLocaleString("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>}
        </div>
      )}

      {checking && <p className="mt-3 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-3 text-[13px] text-white/60">{checking}</p>}
      {err && <p className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">{err}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {status === "idle" || status === "finished" ? (
          <button onClick={start} disabled={busy}
            className="flex-1 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3.5 font-display text-[15px] font-bold text-white shadow-[0_16px_40px_-14px_rgba(182,109,199,0.85)] transition hover:-translate-y-0.5 disabled:opacity-50">
            {busy ? (checking || "Starting…") : status === "finished" ? "Track another shift" : "Start job"}
          </button>
        ) : (
          <>
            {status === "running" ? (
              <button onClick={pause}
                className="flex-1 rounded-2xl border border-white/15 bg-white/[0.06] px-6 py-3.5 font-display text-[15px] font-bold text-white/80 transition hover:bg-white/[0.12]">
                Pause
              </button>
            ) : (
              <button onClick={resume}
                className="flex-1 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-3.5 font-display text-[15px] font-bold text-white transition hover:-translate-y-0.5">
                Resume
              </button>
            )}
            <button onClick={finish}
              className="flex-1 rounded-2xl border border-rose-400/30 px-6 py-3.5 font-display text-[15px] font-bold text-rose-300 transition hover:bg-rose-500/10">
              Finish
            </button>
          </>
        )}
      </div>

      {status === "idle" && (
        <p className="mt-3 text-[13px] leading-relaxed text-white/40">
          Checks you&apos;re at the job before it starts, then times your shift and watches you stay in the
          right area. Keep this page open while you walk — it can&apos;t track with the phone locked.
          Strava and Map My Walk are still needed.
        </p>
      )}

      {sessionId && status === "finished" && (
        <p className="mt-3 text-[13px] text-white/45">
          {clock(elapsed)} tracked{share !== null ? `, ${share}% inside your area` : ""}. The office can see this
          against your shift.
        </p>
      )}
    </GlassCard>
  );
}
