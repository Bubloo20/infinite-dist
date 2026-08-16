"use client";

import { useEffect, useRef, useState } from "react";

const MAX_BYTES = 1.5 * 1024 * 1024;

/**
 * An image field that takes a paste, a drag-drop or a file pick.
 *
 * Screenshots almost always start life on the clipboard, so pasting is the
 * path most people reach for first — the file picker is the fallback, not the
 * other way round. Paste is captured while the field is focused or hovered so
 * two of these on one page don't both grab the same clipboard image.
 */
export default function ImageDrop({
  value,
  onChange,
  label = "Area diagram",
  hint = "Paste a screenshot, drop an image, or choose a file.",
}: {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  hint?: string;
}) {
  const zone = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState(false);
  const [armed, setArmed] = useState(false);
  const [err, setErr] = useState("");

  const take = (file: File | null | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("That isn't an image."); return; }
    if (file.size > MAX_BYTES) { setErr("Image is too big — keep it under 1.5 MB."); return; }
    const r = new FileReader();
    r.onload = () => { setErr(""); onChange(String(r.result || "")); };
    r.onerror = () => setErr("Couldn't read that file.");
    r.readAsDataURL(file);
  };

  // Only listen while this field is the one being used.
  useEffect(() => {
    if (!armed) return;
    const onPaste = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
      if (!item) return;
      e.preventDefault();
      take(item.getAsFile());
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [armed]);

  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold text-white/35">{label}</span>
      <div
        ref={zone}
        tabIndex={0}
        onMouseEnter={() => setArmed(true)}
        onMouseLeave={() => setArmed(false)}
        onFocus={() => setArmed(true)}
        onBlur={() => setArmed(false)}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); take(e.dataTransfer.files?.[0]); }}
        className={`rounded-xl border border-dashed px-3 py-3 text-center transition outline-none ${
          over ? "border-orchid/70 bg-orchid/10" : "border-white/15 bg-white/[0.04] hover:border-white/25"}`}
      >
        {value ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Area diagram" className="h-20 rounded-lg border border-white/12 object-contain" />
            <div className="text-left">
              <p className="text-[12px] font-semibold text-white/70">Diagram attached</p>
              <button type="button" onClick={() => onChange("")}
                className="mt-1 text-[12px] text-white/40 transition hover:text-rose-300">Remove</button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-white/50">
              <span className="font-bold text-white/75">Paste</span> a screenshot here, drop one in, or
            </p>
            <label className="mt-1.5 inline-block cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-bold text-white transition hover:bg-white/15">
              Choose a file
              <input type="file" accept="image/*" className="hidden"
                onChange={(e) => take(e.target.files?.[0])} />
            </label>
          </>
        )}
      </div>
      {err ? <p className="mt-1 text-[12px] text-rose-300">{err}</p>
           : <p className="mt-1 text-[12px] text-white/30">{hint}</p>}
    </div>
  );
}
