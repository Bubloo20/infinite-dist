"use client";

import { useState } from "react";

const MAX_PHOTOS = 12;
/** Longest edge after downscaling — plenty to see a letterbox, small to store. */
const MAX_EDGE = 1100;
const QUALITY = 0.62;

/** Shrink and re-encode, so a 4 MB phone photo lands at roughly 100 KB. */
function downscale(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That file isn't an image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        if (!ctx) { reject(new Error("Couldn't process that photo.")); return; }
        ctx.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", QUALITY));
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Optional photos on a shift — letterbox shots, access problems, anything worth
 * showing. Taken straight from the camera on a phone, and shrunk before they go
 * anywhere so a dozen of them stay a sensible size.
 */
export default function PhotoUpload({
  photos, onChange, label = "Photos", hint = "Optional — letterboxes, access issues, anything worth showing.",
}: {
  photos: string[];
  onChange: (next: string[]) => void;
  label?: string;
  hint?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const take = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr("");
    setBusy(true);
    try {
      const room = MAX_PHOTOS - photos.length;
      if (room <= 0) { setErr(`That's the ${MAX_PHOTOS} photo limit.`); return; }
      const picked = [...files].filter((f) => f.type.startsWith("image/")).slice(0, room);
      if (!picked.length) { setErr("Those weren't images."); return; }
      const shrunk: string[] = [];
      for (const f of picked) {
        try { shrunk.push(await downscale(f)); } catch { /* skip the odd bad file */ }
      }
      if (!shrunk.length) { setErr("Couldn't read those photos."); return; }
      onChange([...photos, ...shrunk]);
      if (picked.length < files.length) setErr(`Added ${shrunk.length} — ${MAX_PHOTOS} is the limit.`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="mb-2 block text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">
        {label} <span className="text-white/30">({photos.length}/{MAX_PHOTOS})</span>
      </label>

      {photos.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-white/12">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((_, k) => k !== i))}
                aria-label={`Remove photo ${i + 1}`}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-[13px] font-bold text-white/90 transition hover:bg-rose-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={`flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-3.5 text-[14px] font-semibold transition ${
          busy ? "border-white/10 text-white/30" : "border-white/20 text-white/70 hover:border-white/35 hover:text-white"
        }`}
      >
        {busy ? "Adding…" : photos.length ? "Add more photos" : "Add photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => { take(e.target.files); e.target.value = ""; }}
        />
      </label>

      {err ? <p className="mt-2 text-[13px] text-amber-300">{err}</p>
           : <p className="mt-2 text-[13px] text-white/30">{hint}</p>}
    </div>
  );
}
