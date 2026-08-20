"use client";

import { useEffect, useRef, useState } from "react";
import { GlassCard, ActionButton } from "./PortalShell";

/** Long edge to scale a signature down to before it's stored. */
const MAX_EDGE = 900;

/** Shrink whatever was given so a photo of a signature doesn't bloat the row. */
function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't an image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        // PNG, so a signature on white keeps whatever transparency it came with.
        resolve(c.toDataURL("image/png"));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * The signature that goes on every agreement the office issues.
 *
 * Stored rather than committed as a file, so it can be set — or changed — from
 * the dashboard without a deploy.
 */
export default function SignatureSetting() {
  const [sig, setSig] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const drop = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/portal/admin/settings")
      .then((r) => r.json())
      .then((d) => setSig(d?.signature ?? null))
      .catch(() => setMsg("Couldn't load the current signature."));
  }, []);

  const take = async (file: File | null | undefined) => {
    if (!file) return;
    setMsg(""); setOk(false);
    try {
      setSig(await toDataUrl(file));
      setMsg("Ready — press Save to use it on contracts.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn't read that image.");
    }
  };

  // Paste straight from a screenshot.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (item) take(item.getAsFile());
    };
    const node = drop.current;
    node?.addEventListener("paste", onPaste as EventListener);
    return () => node?.removeEventListener("paste", onPaste as EventListener);
  }, []);

  const save = async () => {
    setMsg(""); setOk(false);
    const r = await fetch("/api/portal/admin/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signature: sig }),
    });
    const d = await r.json();
    if (!d.ok) { setMsg(d.error || "Couldn't save it."); return; }
    setOk(true);
    setMsg(sig ? "Saved — every contract is signed with this now." : "Removed.");
  };

  return (
    <GlassCard className="p-6">
      <h3 className="font-display text-lg font-bold text-white">Your signature on contracts</h3>
      <p className="mt-1 text-[13px] text-white/45">
        Goes in the Infinite Distribution representative box on every agreement, alongside the date
        it was drawn up. A PNG with a transparent background looks best.
      </p>

      <div
        ref={drop}
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); take(e.dataTransfer.files?.[0]); }}
        className="mt-4 rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-4 outline-none focus:border-orchid/60"
      >
        {sig ? (
          <div className="rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={sig} alt="Signature" className="h-24 w-full object-contain object-left" />
          </div>
        ) : (
          <p className="py-6 text-center text-[13px] text-white/40">
            Nothing set — contracts print a blank signing line.
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="cursor-pointer rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-[13px] font-bold text-white/80 transition hover:bg-white/[0.12]">
            Choose an image
            <input type="file" accept="image/*" className="hidden"
              onChange={(e) => take(e.target.files?.[0])} />
          </label>
          <span className="text-[12px] text-white/35">or drop one here, or click this box and paste</span>
          {sig && (
            <button onClick={() => { setSig(null); setMsg("Press Save to remove it."); setOk(false); }}
              className="ml-auto text-[13px] font-semibold text-white/35 transition hover:text-rose-300">
              Remove
            </button>
          )}
        </div>
      </div>

      {msg && (
        <p className={`mt-3 rounded-xl border px-4 py-2.5 text-[13px] ${
          ok ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
             : "border-white/12 bg-white/[0.04] text-white/60"}`}>
          {msg}
        </p>
      )}

      <ActionButton
        className="mt-4 rounded-2xl bg-gradient-to-r from-electric to-orchid px-6 py-2.5 font-display text-[13px] font-bold text-white"
        busyLabel="Saving…"
        onClick={save}
      >
        Save signature
      </ActionButton>
    </GlassCard>
  );
}
