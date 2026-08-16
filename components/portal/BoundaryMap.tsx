"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

export type LatLng = [number, number];

/** Ray casting on [lat, lng] pairs — x is longitude, y is latitude. */
export function insideBoundary(pt: LatLng, poly: LatLng[]): boolean {
  if (poly.length < 3) return false;
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [yi, xi] = poly[i];
    const [yj, xj] = poly[j];
    if (xi > pt[1] !== xj > pt[1] && pt[0] < ((yj - yi) * (pt[1] - xi)) / (xj - xi) + yi) hit = !hit;
  }
  return hit;
}

/**
 * Interactive delivery-area map.
 *
 * Real slippy-map tiles, so it zooms and pans like Google Maps rather than
 * being a flat screenshot. In `edit` mode clicking drops boundary points and
 * the polygon closes automatically; in `view` mode the worker just explores it.
 */
export default function BoundaryMap({
  boundary,
  center,
  editable = false,
  height = 380,
  locate = false,
  onChange,
}: {
  boundary: LatLng[];
  center?: [number, number, number] | null;
  editable?: boolean;
  height?: number;
  /** Track and plot the viewer's own position against the boundary. */
  locate?: boolean;
  onChange?: (points: LatLng[], center: [number, number, number]) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const layerRef = useRef<unknown>(null);
  const ptsRef = useRef<LatLng[]>(boundary);
  const meRef = useRef<{ marker: unknown; halo: unknown }>({ marker: null, halo: null });
  const [count, setCount] = useState(boundary.length);
  const [me, setMe] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoErr, setGeoErr] = useState("");
  const [following, setFollowing] = useState(false);

  useEffect(() => { ptsRef.current = boundary; setCount(boundary.length); }, [boundary]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const mod = (await import("leaflet")) as unknown as { default?: typeof import("leaflet") };
      const L = (mod.default ?? mod) as typeof import("leaflet");
      if (dead || !holder.current || mapRef.current) return;

      const map = L.map(holder.current, { scrollWheelZoom: true, zoomControl: true });
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(map);

      const group = L.layerGroup().addTo(map);
      layerRef.current = group;

      const redraw = () => {
        group.clearLayers();
        const pts = ptsRef.current;
        if (pts.length >= 3) {
          L.polygon(pts, { color: "#7c3aed", weight: 3, fillColor: "#a855f7", fillOpacity: 0.18 }).addTo(group);
        } else if (pts.length === 2) {
          L.polyline(pts, { color: "#7c3aed", weight: 3 }).addTo(group);
        }
        if (editable) {
          pts.forEach((p, i) => {
            L.circleMarker(p, { radius: 6, color: "#fff", weight: 2, fillColor: "#7c3aed", fillOpacity: 1 })
              .addTo(group)
              .bindTooltip(String(i + 1), { permanent: true, direction: "top", offset: [0, -8], className: "coverage-label" });
          });
        }
      };

      const fit = () => {
        const pts = ptsRef.current;
        if (pts.length >= 2) {
          map.fitBounds(L.latLngBounds(pts).pad(0.25), { animate: false });
        } else if (center) {
          map.setView([center[0], center[1]], center[2]);
        } else if (pts.length === 1) {
          map.setView(pts[0], 15);
        } else {
          map.setView([-37.7697, 145.0017], 13); // Northcote
        }
      };

      redraw();
      fit();

      if (editable) {
        map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
          ptsRef.current = [...ptsRef.current, [e.latlng.lat, e.latlng.lng]];
          setCount(ptsRef.current.length);
          redraw();
          const c = map.getCenter();
          onChange?.(ptsRef.current, [c.lat, c.lng, map.getZoom()]);
        });
      }

      // expose redraw for the clear/undo buttons
      (holder.current as HTMLDivElement & { _redraw?: () => void })._redraw = redraw;

      if (locate) {
        if (!("geolocation" in navigator)) {
          setGeoErr("This device can't share its location.");
        } else {
          let centred = false;
          const watch = navigator.geolocation.watchPosition(
            (pos) => {
              if (dead) return;
              const { latitude, longitude, accuracy } = pos.coords;
              setMe({ lat: latitude, lng: longitude, accuracy });
              setGeoErr("");

              const m = meRef.current;
              if (m.halo) map.removeLayer(m.halo as never);
              if (m.marker) map.removeLayer(m.marker as never);
              m.halo = L.circle([latitude, longitude], {
                radius: Math.max(accuracy, 8), color: "#38bdf8", weight: 1,
                fillColor: "#38bdf8", fillOpacity: 0.15,
              }).addTo(map);
              m.marker = L.circleMarker([latitude, longitude], {
                radius: 7, color: "#fff", weight: 3, fillColor: "#0ea5e9", fillOpacity: 1,
              }).addTo(map).bindTooltip("You", { direction: "top", offset: [0, -8] });

              if (!centred && ptsRef.current.length < 3) {
                map.setView([latitude, longitude], 16);
                centred = true;
              }
            },
            (err) => {
              if (dead) return;
              setGeoErr(
                err.code === err.PERMISSION_DENIED
                  ? "Location is blocked — allow it in your browser to see where you are on this map."
                  : "Couldn't get your location.",
              );
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
          );
          (holder.current as HTMLDivElement & { _watch?: number })._watch = watch;
        }
      }
    })();

    return () => {
      dead = true;
      const w = (holder.current as (HTMLDivElement & { _watch?: number }) | null)?._watch;
      if (w !== undefined && "geolocation" in navigator) navigator.geolocation.clearWatch(w);
      const m = mapRef.current as { remove?: () => void } | null;
      if (m?.remove) { m.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, locate]);

  const recentre = () => {
    const m = mapRef.current as { setView?: (c: LatLng, z: number) => void } | null;
    if (me && m?.setView) { m.setView([me.lat, me.lng], 17); setFollowing(true); }
  };

  const mutate = (next: LatLng[]) => {
    ptsRef.current = next;
    setCount(next.length);
    (holder.current as (HTMLDivElement & { _redraw?: () => void }) | null)?._redraw?.();
    const m = mapRef.current as { getCenter?: () => { lat: number; lng: number }; getZoom?: () => number } | null;
    const c = m?.getCenter?.();
    onChange?.(next, c ? [c.lat, c.lng, m!.getZoom!()] : [-37.7697, 145.0017, 13]);
  };

  return (
    <div>
      <div
        ref={holder}
        style={{ height }}
        className="relative z-0 w-full overflow-hidden rounded-2xl border border-white/12"
      />
      {locate && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {me ? (
            <>
              <span className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold ${
                boundary.length >= 3
                  ? insideBoundary([me.lat, me.lng], boundary)
                    ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                    : "border-amber-400/35 bg-amber-500/10 text-amber-300"
                  : "border-sky-400/35 bg-sky-500/10 text-sky-300"}`}>
                {boundary.length >= 3
                  ? insideBoundary([me.lat, me.lng], boundary) ? "You're inside the area" : "You're outside the area"
                  : "Your location"}
              </span>
              <span className="text-[12px] text-white/35">accurate to about {Math.round(me.accuracy)} m</span>
              <button type="button" onClick={recentre}
                className="ml-auto rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1]">
                {following ? "Centre on me" : "Where am I?"}
              </button>
            </>
          ) : (
            <span className="text-[12px] text-white/40">{geoErr || "Finding your location…"}</span>
          )}
        </div>
      )}
      {editable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-white/45">
            {count === 0 ? "Click the map to trace the delivery boundary." : `${count} point${count === 1 ? "" : "s"} — click to add more.`}
          </span>
          <button type="button" onClick={() => mutate(ptsRef.current.slice(0, -1))} disabled={!count}
            className="ml-auto rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1] disabled:opacity-40">
            Undo point
          </button>
          <button type="button" onClick={() => mutate([])} disabled={!count}
            className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1] disabled:opacity-40">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
