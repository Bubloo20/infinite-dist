"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "leaflet/dist/leaflet.css";

export type LatLng = [number, number];
export type Shape = LatLng[];

/**
 * What the office drew.
 *
 * `area` is one closed polygon — the whole patch is the worker's.
 * `roads` is a set of separate runs, so a job can be "these four streets" with
 * a few points dropped along each one rather than a blanket area.
 */
export type AreaSpec = { mode: "area" | "roads"; shapes: Shape[]; arrows?: Arrow[] };

/**
 * "Start here, head that way."
 *
 * Drawn on top of whatever the area or the runs say, because where someone
 * begins is a separate question from where they're allowed to walk.
 */
export type Arrow = { from: LatLng; to: LatLng };

export const EMPTY_SPEC: AreaSpec = { mode: "area", shapes: [] };

/**
 * Read whatever is stored on a job or sub-contract. Areas were once saved as a
 * bare list of points, so that shape is still understood.
 */
export function parseSpec(raw: string | null | undefined): AreaSpec {
  if (!raw) return EMPTY_SPEC;
  try {
    const v = JSON.parse(raw);
    if (Array.isArray(v)) {
      if (!v.length) return EMPTY_SPEC;
      if (typeof v[0]?.[0] === "number") return { mode: "area", shapes: [v as Shape] };
      return { mode: "area", shapes: v as Shape[] };
    }
    if (v && typeof v === "object" && Array.isArray(v.shapes)) {
      return {
        mode: v.mode === "roads" ? "roads" : "area",
        shapes: v.shapes as Shape[],
        arrows: Array.isArray(v.arrows) ? (v.arrows as Arrow[]) : undefined,
      };
    }
  } catch {
    /* stored value isn't usable */
  }
  return EMPTY_SPEC;
}

export const specHasDrawing = (s: AreaSpec) =>
  (s.arrows?.length ?? 0) > 0 ||
  (s.mode === "area" ? (s.shapes[0]?.length ?? 0) >= 3 : s.shapes.some((r) => r.length >= 2));

export const countPoints = (s: AreaSpec) => s.shapes.reduce((t, r) => t + r.length, 0);

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

/** Metres between two points — enough to say "you're 40 m from that road". */
function metresBetween(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Metres from a point to the nearest edge of a polygon — 0 if inside.
 *
 * Distance to the nearest corner isn't good enough: a boundary can run a long
 * way between corners, and someone standing beside that stretch would read as
 * far outside when they're right on the line.
 */
export function distanceToArea(pt: LatLng, poly: LatLng[]): number {
  if (poly.length < 2) return Infinity;
  if (insideBoundary(pt, poly)) return 0;

  // Work in metres locally so segment maths is straightforward.
  const latToM = 111_320;
  const lngToM = 111_320 * Math.cos((pt[0] * Math.PI) / 180);
  const toXY = (p: LatLng) => [(p[1] - pt[1]) * lngToM, (p[0] - pt[0]) * latToM];

  let best = Infinity;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [ax, ay] = toXY(poly[j]);
    const [bx, by] = toXY(poly[i]);
    const dx = bx - ax;
    const dy = by - ay;
    const len2 = dx * dx + dy * dy;
    // How far along the segment the closest point sits, clamped to its ends.
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2));
    const cx = ax + t * dx;
    const cy = ay + t * dy;
    best = Math.min(best, Math.hypot(cx, cy));
  }
  return best;
}

function nearestDistance(pt: LatLng, shapes: Shape[]): number | null {
  let best: number | null = null;
  for (const shape of shapes) {
    for (const p of shape) {
      const d = metresBetween(pt, p);
      if (best === null || d < best) best = d;
    }
  }
  return best;
}

type Hit = {
  label: string; short: string; context: string; kind: string;
  lat: number; lng: number;
  box: [[number, number], [number, number]] | null;
  /** The real outline, when the place has one: a suburb's border or a street's line. */
  shape?: { kind: "line" | "ring"; parts: LatLng[][] } | null;
};

/**
 * How far outside the job we tolerate before warning. GPS in a suburb is
 * routinely tens of metres out, so the device's own accuracy is taken as the
 * floor — otherwise a bad fix cries wolf while someone is standing on the spot.
 */
const OUT_OF_ZONE_M = 20;

/** "80 m" / "1.4 km" — a distance a person can read at a glance. */
const readable = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

const ROAD_COLOURS = ["#7c3aed", "#0ea5e9", "#f59e0b", "#ec4899", "#10b981", "#f43f5e"];

export default function BoundaryMap({
  spec: specProp,
  center,
  editable = false,
  height = 380,
  locate = false,
  fullHref,
  expandable = false,
  onChange,
}: {
  spec: AreaSpec;
  center?: [number, number, number] | null;
  editable?: boolean;
  height?: number;
  /** Track and plot the viewer's own position against what was drawn. */
  locate?: boolean;
  /** Where the "Full screen" link goes. Omitted, no link is shown. */
  fullHref?: string;
  /** Offer a full-window version for drawing in. */
  expandable?: boolean;
  onChange?: (spec: AreaSpec, center: [number, number, number]) => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const groupRef = useRef<import("leaflet").LayerGroup | null>(null);
  // The search result sits in its own layer so clearing it never touches the
  // boundary being drawn.
  const foundRef = useRef<import("leaflet").LayerGroup | null>(null);
  const glowTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const specRef = useRef<AreaSpec>(specProp);
  const newRunRef = useRef(false);
  // Half-placed arrow: the tail is down, waiting for the click that aims it.
  const arrowTail = useRef<LatLng | null>(null);
  const onChangeRef = useRef(onChange);
  const emitRef = useRef<((next: AreaSpec) => void) | null>(null);

  const [spec, setSpec] = useState<AreaSpec>(specProp);
  const [me, setMe] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoErr, setGeoErr] = useState("");

  const [placingArrow, setPlacingArrow] = useState(false);
  const [arrowHint, setArrowHint] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [vh, setVh] = useState(800);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchMsg, setSearchMsg] = useState("");

  const placingRef = useRef(false);
  useEffect(() => { placingRef.current = placingArrow; }, [placingArrow]);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  // The full-window map is sized in pixels, so it has to follow the window.
  useEffect(() => {
    if (!expanded) return;
    const fit = () => setVh(window.innerHeight);
    fit();
    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", fit);
    // Nothing behind it should scroll while it's covering the screen.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("resize", fit);
      window.removeEventListener("orientationchange", fit);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  // Escape closes it, the same as the button.
  useEffect(() => {
    if (!expanded) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [expanded]);
  useEffect(() => { specRef.current = specProp; setSpec(specProp); }, [specProp]);

  /** Move one point of one shape — used when a node is dragged. */
  const movePoint = useCallback((si: number, pi: number, to: LatLng) => {
    const cur = specRef.current;
    const shapes = cur.shapes.map((r, i) => (i === si ? r.map((q, j) => (j === pi ? to : q)) : r));
    emitRef.current?.({ mode: cur.mode, shapes });
  }, []);

  /** Drop one point, and the shape with it if that was the last one. */
  const removePoint = useCallback((si: number, pi: number) => {
    const cur = specRef.current;
    const shapes = cur.shapes
      .map((r, i) => (i === si ? r.filter((_, j) => j !== pi) : r))
      .filter((r) => r.length > 0);
    emitRef.current?.({ mode: cur.mode, shapes });
  }, []);

  /** Repaint everything the office has drawn. */
  const redraw = useCallback(() => {
    const L = LRef.current;
    const group = groupRef.current;
    if (!L || !group) return;
    group.clearLayers();

    // A draggable handle the office can grab, or click to take out again.
    const node = (pt: LatLng, si: number, pi: number, label: string, colour: string) => {
      if (!editable) {
        L.circleMarker(pt, { radius: 5, color: "#fff", weight: 2, fillColor: colour, fillOpacity: 1 }).addTo(group);
        return;
      }
      const marker = L.marker(pt, {
        draggable: true,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          html: `<span style="display:block;width:18px;height:18px;border-radius:9999px;background:${colour};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.45);cursor:grab"></span>`,
        }),
      }).addTo(group);

      marker.bindTooltip(label, { permanent: true, direction: "top", offset: [0, -12], className: "coverage-label" });
      marker.on("dragend", (ev: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
        const ll = ev.target.getLatLng();
        movePoint(si, pi, [ll.lat, ll.lng]);
      });
      marker.on("click", (ev: { originalEvent?: Event }) => {
        ev.originalEvent?.stopPropagation();
        if (window.confirm(`Remove ${label}?`)) removePoint(si, pi);
      });
    };

    const s = specRef.current;

    // Start arrows, over the top of whatever else is drawn.
    (s.arrows || []).forEach((a, ai) => {
      const GREEN = "#22c55e";
      L.polyline([a.from, a.to], { color: "#0b2f18", weight: 9, opacity: 0.55, lineCap: "round", interactive: false }).addTo(group);
      L.polyline([a.from, a.to], { color: GREEN, weight: 4, opacity: 1, lineCap: "round", interactive: false }).addTo(group);

      // The head: a triangle sitting on the end, turned to face the way it points.
      const bearing = (Math.atan2(a.to[1] - a.from[1], a.to[0] - a.from[0]) * 180) / Math.PI;
      L.marker(a.to, {
        interactive: false,
        icon: L.divIcon({
          className: "",
          iconSize: [20, 20],
          iconAnchor: [10, 10],
          html:
            `<span style="display:block;width:0;height:0;margin:1px 0 0 2px;` +
            `border-left:8px solid transparent;border-right:8px solid transparent;` +
            `border-bottom:15px solid ${GREEN};filter:drop-shadow(0 1px 2px rgba(0,0,0,.6));` +
            `transform:rotate(${bearing}deg);transform-origin:50% 60%"></span>`,
        }),
      }).addTo(group);

      // The tail is the bit that says "start", and the bit you grab.
      const tail = L.marker(a.from, {
        draggable: editable,
        keyboard: false,
        icon: L.divIcon({
          className: "",
          iconSize: [16, 16],
          iconAnchor: [8, 8],
          html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${GREEN};border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.45)"></span>`,
        }),
      }).addTo(group);
      tail.bindTooltip((s.arrows || []).length > 1 ? `Start ${ai + 1}` : "Start here",
        { permanent: true, direction: "top", offset: [0, -10], className: "coverage-label" });

      if (!editable) return;
      tail.on("dragend", (ev: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
        const ll = ev.target.getLatLng();
        const cur = specRef.current;
        const arrows = (cur.arrows || []).map((x, i) => (i === ai ? { ...x, from: [ll.lat, ll.lng] as LatLng } : x));
        emitRef.current?.({ ...cur, arrows });
      });
      tail.on("click", (ev: { originalEvent?: Event }) => {
        ev.originalEvent?.stopPropagation();
        if (!window.confirm("Remove this start arrow?")) return;
        const cur = specRef.current;
        emitRef.current?.({ ...cur, arrows: (cur.arrows || []).filter((_, i) => i !== ai) });
      });

      // Dragging the head re-aims it.
      const head = L.marker(a.to, {
        draggable: true, keyboard: false,
        icon: L.divIcon({ className: "", iconSize: [26, 26], iconAnchor: [13, 13], html: "<span style=\"display:block;width:26px;height:26px\"></span>" }),
      }).addTo(group);
      head.on("dragend", (ev: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
        const ll = ev.target.getLatLng();
        const cur = specRef.current;
        const arrows = (cur.arrows || []).map((x, i) => (i === ai ? { ...x, to: [ll.lat, ll.lng] as LatLng } : x));
        emitRef.current?.({ ...cur, arrows });
      });
    });

    if (s.mode === "area") {
      const pts = s.shapes[0] || [];
      if (pts.length >= 3) {
        L.polygon(pts, { color: "#7c3aed", weight: 3, fillColor: "#a855f7", fillOpacity: 0.18 }).addTo(group);
      } else if (pts.length === 2) {
        L.polyline(pts, { color: "#7c3aed", weight: 3 }).addTo(group);
      }
      pts.forEach((pt, i) => node(pt, 0, i, String(i + 1), "#7c3aed"));
      return;
    }

    // Roads: each run is its own line, in its own colour.
    s.shapes.forEach((run, ri) => {
      const colour = ROAD_COLOURS[ri % ROAD_COLOURS.length];
      if (run.length >= 2) {
        L.polyline(run, { color: colour, weight: 6, opacity: 0.85, lineCap: "round" }).addTo(group);
      }
      run.forEach((pt, i) => node(pt, ri, i, i === 0 ? `Road ${ri + 1}` : `Road ${ri + 1}.${i + 1}`, colour));
    });
  }, [editable, movePoint, removePoint]);

  const emit = useCallback((next: AreaSpec) => {
    specRef.current = next;
    setSpec(next);
    redraw();
    const m = mapRef.current;
    const c = m?.getCenter();
    onChangeRef.current?.(next, c ? [c.lat, c.lng, m!.getZoom()] : [-37.7697, 145.0017, 13]);
  }, [redraw]);

  useEffect(() => { emitRef.current = emit; }, [emit]);

  useEffect(() => {
    let dead = false;
    (async () => {
      const mod = (await import("leaflet")) as unknown as { default?: typeof import("leaflet") };
      const L = (mod.default ?? mod) as typeof import("leaflet");
      // Core Leaflet can't rotate; this plugin adds bearing and the gestures.
      await import("leaflet-rotate");
      if (dead || !holder.current || mapRef.current) return;
      LRef.current = L;

      const map = L.map(holder.current, {
        scrollWheelZoom: true,
        zoomControl: true,
        // Pinch to zoom, and let it settle anywhere rather than snapping a whole level.
        touchZoom: true,
        zoomSnap: 0,
        zoomDelta: 0.5,
        wheelPxPerZoomLevel: 90,
        // Two-finger twist on a touchscreen, shift-drag with a mouse.
        rotate: true,
        touchRotate: true,
        shiftKeyRotate: true,
        rotateControl: { closeOnZeroBearing: false },
      } as L.MapOptions);
      mapRef.current = map;

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 20,
      }).addTo(map);

      groupRef.current = L.layerGroup().addTo(map);
      foundRef.current = L.layerGroup().addTo(map);
      redraw();

      // Frame whatever exists, else the saved view, else Northcote.
      const all = specRef.current.shapes.flat();
      if (all.length >= 2) map.fitBounds(L.latLngBounds(all).pad(0.25), { animate: false });
      else if (center) map.setView([center[0], center[1]], center[2]);
      else if (all.length === 1) map.setView(all[0], 16);
      else map.setView([-37.7697, 145.0017], 13);

      if (editable) {
        map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
          const pt: LatLng = [e.latlng.lat, e.latlng.lng];
          const cur = specRef.current;

          // Placing a start arrow: first click is where they begin, second is
          // the direction to head off in.
          if (placingRef.current) {
            if (!arrowTail.current) {
              arrowTail.current = pt;
              setArrowHint("Now click the way they should head.");
              return;
            }
            const from = arrowTail.current;
            arrowTail.current = null;
            setPlacingArrow(false);
            setArrowHint("");
            emit({ ...cur, arrows: [...(cur.arrows || []), { from, to: pt }] });
            return;
          }

          if (cur.mode === "area") {
            emit({ ...cur, mode: "area", shapes: [[...(cur.shapes[0] || []), pt]] });
            return;
          }
          const shapes = cur.shapes.map((r) => [...r]);
          if (newRunRef.current || !shapes.length) {
            shapes.push([pt]);
            newRunRef.current = false;
          } else {
            shapes[shapes.length - 1].push(pt);
          }
          emit({ ...cur, mode: "roads", shapes });
        });
      }

      if (locate) {
        if (!("geolocation" in navigator)) {
          setGeoErr("This device can't share its location.");
        } else {
          let centred = false;
          let mine: { halo: import("leaflet").Circle; dot: import("leaflet").CircleMarker } | null = null;
          const watch = navigator.geolocation.watchPosition(
            (pos) => {
              if (dead) return;
              const { latitude, longitude, accuracy } = pos.coords;
              setMe({ lat: latitude, lng: longitude, accuracy });
              setGeoErr("");
              if (mine) { map.removeLayer(mine.halo); map.removeLayer(mine.dot); }
              mine = {
                halo: L.circle([latitude, longitude], {
                  radius: Math.max(accuracy, 8), color: "#38bdf8", weight: 1,
                  fillColor: "#38bdf8", fillOpacity: 0.15,
                }).addTo(map),
                dot: L.circleMarker([latitude, longitude], {
                  radius: 7, color: "#fff", weight: 3, fillColor: "#0ea5e9", fillOpacity: 1,
                }).addTo(map).bindTooltip("You", { direction: "top", offset: [0, -8] }),
              };
              if (!centred && !specRef.current.shapes.flat().length) {
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
      mapRef.current?.remove();
      mapRef.current = null;
      groupRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editable, locate]);

  useEffect(() => { redraw(); }, [spec, redraw]);


  /**
   * Move to a search result and show what was found.
   *
   * A house gets a pin dropped on it. A suburb is outlined in a dashed border
   * so you can see where it actually ends. A street lights up along its length
   * for a moment and then fades, which is enough to pick it out of the grid
   * without leaving clutter behind.
   */
  const go = (h: Hit) => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (glowTimer.current) { clearTimeout(glowTimer.current); glowTimer.current = null; }
    foundRef.current?.clearLayers();
    const layer = foundRef.current;

    const ring = h.shape?.kind === "ring" ? h.shape.parts : null;
    const line = h.shape?.kind === "line" ? h.shape.parts : null;

    if (layer && line?.length) {
      // Wide soft stroke under a bright one — that reads as a glow.
      line.forEach((part) => {
        L.polyline(part, { color: "#b66dc7", weight: 16, opacity: 0.35, lineCap: "round", interactive: false }).addTo(layer);
        L.polyline(part, { color: "#ffffff", weight: 3, opacity: 0.95, lineCap: "round", interactive: false }).addTo(layer);
      });
      glowTimer.current = setTimeout(() => foundRef.current?.clearLayers(), 1600);
    } else if (layer && ring?.length) {
      ring.forEach((part) => {
        L.polygon(part, {
          color: "#b66dc7", weight: 2.5, opacity: 0.95, dashArray: "7 7",
          fillColor: "#b66dc7", fillOpacity: 0.06, interactive: false,
        }).addTo(layer);
      });
    } else if (layer && (h.kind === "address" || h.kind === "building" || h.kind === "house")) {
      L.marker([h.lat, h.lng], {
        interactive: false,
        icon: L.divIcon({
          className: "",
          html:
            '<span style="display:block;width:22px;height:22px;border-radius:9999px 9999px 9999px 0;' +
            'transform:rotate(-45deg);background:#b66dc7;border:3px solid #fff;' +
            'box-shadow:0 3px 8px rgba(0,0,0,0.5);animation:idp-pin-drop .45s cubic-bezier(.22,1,.36,1)"></span>',
          iconSize: [22, 30],
          iconAnchor: [11, 30],
        }),
      }).addTo(layer);
    } else if (layer && h.box) {
      // No outline came back — dash the extent so there's still something to see.
      const [[s0, w0], [n0, e0]] = h.box;
      L.polygon([[s0, w0], [n0, w0], [n0, e0], [s0, e0]], {
        color: "#b66dc7", weight: 2, opacity: 0.8, dashArray: "7 7",
        fillColor: "#b66dc7", fillOpacity: 0.05, interactive: false,
      }).addTo(layer);
    }

    // Frame the thing itself when we know its shape, otherwise its extent.
    const pts = (ring || line || []).flat();
    if (pts.length >= 2) map.fitBounds(L.latLngBounds(pts).pad(0.15), { animate: false, maxZoom: 18 });
    else if (h.box) map.fitBounds(L.latLngBounds(h.box), { animate: false, maxZoom: 17 });
    else map.setView([h.lat, h.lng], 18);
  };

  const search = async () => {
    const term = q.trim();
    if (term.length < 3) { setSearchMsg("Type at least three characters."); return; }
    setSearching(true); setSearchMsg(""); setHits([]);
    try {
      const r = await fetch(`/api/portal/place-search?q=${encodeURIComponent(term)}`);
      const d = await r.json();
      if (!d.ok) { setSearchMsg(d.error || "Search failed."); return; }
      if (!d.results?.length) { setSearchMsg(`Nothing found for “${term}”.`); return; }
      setHits(d.results);
      go(d.results[0]);
    } catch {
      setSearchMsg("Search failed.");
    } finally {
      setSearching(false);
    }
  };

  /** Where the small map is looking right now, so the big one opens there. */
  const liveCenter = (): [number, number, number] | null => {
    const map = mapRef.current;
    if (!map) return center ?? null;
    const c = map.getCenter();
    return [c.lat, c.lng, map.getZoom()];
  };

  const recentre = () => {
    if (me) mapRef.current?.setView([me.lat, me.lng], 17);
  };

  const setMode = (mode: "area" | "roads") => {
    if (mode === spec.mode) return;
    newRunRef.current = mode === "roads";
    // Switching keeps what's drawn: runs collapse to the longest, an area becomes one run.
    const shapes = mode === "area"
      ? [spec.shapes.slice().sort((a, b) => b.length - a.length)[0] || []].filter((r) => r.length > 0)
      : spec.shapes.filter((r) => r.length > 0);
    emit({ ...spec, mode, shapes });
  };

  const undo = () => {
    const cur = specRef.current;
    const shapes = cur.shapes.map((r) => [...r]);
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (shapes[i].length) { shapes[i].pop(); break; }
    }
    emit({ ...cur, shapes: shapes.filter((r) => r.length > 0) });
  };

  const points = countPoints(spec);
  const runs = spec.shapes.filter((r) => r.length > 0).length;
  const drawnArea = spec.mode === "area" ? spec.shapes[0] || [] : [];
  const nearest = me && spec.mode === "roads" ? nearestDistance([me.lat, me.lng], spec.shapes) : null;

  /**
   * Metres outside the job, or null when they're near enough. The tolerance is
   * whichever is larger of the fixed margin and the fix's own accuracy.
   */
  const outOfZone = (() => {
    if (!me) return null;
    const tolerance = Math.max(OUT_OF_ZONE_M, me.accuracy || 0);
    const away = drawnArea.length >= 3
      ? distanceToArea([me.lat, me.lng], drawnArea)
      : nearest;
    if (away === null || away <= tolerance) return null;
    return away;
  })();
  const inZone = me !== null && outOfZone === null && (drawnArea.length >= 3 || nearest !== null);

  return (
    <div className="relative">
      {editable && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <div className="flex min-w-[240px] flex-1 gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
              placeholder="Find an address, street or suburb — e.g. 12 Porter Rd, Heidelberg"
              className="w-full rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-orchid/60 focus:bg-white/[0.08]"
            />
            <button type="button" onClick={search} disabled={searching}
              className="shrink-0 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/[0.1] hover:text-white disabled:opacity-50">
              {searching ? "…" : "Find"}
            </button>
          </div>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1">
            {([["area", "Draw an area"], ["roads", "Draw roads"]] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setMode(k)}
                className={`rounded-lg px-3.5 py-1.5 text-[13px] font-bold transition ${
                  spec.mode === k ? "bg-white/[0.14] text-white" : "text-white/45 hover:text-white/75"}`}>
                {label}
              </button>
            ))}
          </div>

          {/* Where to begin is its own thing — it sits over an area or runs alike. */}
          <button type="button"
            onClick={() => {
              arrowTail.current = null;
              const on = !placingArrow;
              setPlacingArrow(on);
              setArrowHint(on ? "Click where they should start." : "");
            }}
            className={`shrink-0 rounded-xl border px-3.5 py-2.5 text-[13px] font-bold transition ${
              placingArrow
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-200"
                : "border-white/12 bg-white/[0.06] text-white/75 hover:bg-white/[0.1] hover:text-white"}`}>
            {placingArrow ? "Placing start…" : "Start arrow"}
          </button>
        </div>
      )}

      {editable && hits.length > 1 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {hits.slice(0, 6).map((h, i) => (
            <button key={i} type="button" onClick={() => go(h)} title={h.label}
              className="rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1 text-left text-[12px] text-white/70 transition hover:bg-white/[0.09] hover:text-white">
              {h.short || h.label.split(",")[0]}
              {/* Four streets can share a name — the suburb is what separates them. */}
              {h.context ? <span className="text-white/40"> · {h.context}</span> : null}
            </button>
          ))}
        </div>
      )}
      {editable && searchMsg && <p className="mb-2 text-[12px] text-amber-300/80">{searchMsg}</p>}
      {editable && arrowHint && <p className="mb-2 text-[12px] font-semibold text-emerald-300">{arrowHint}</p>}

      {/*
        The size lives on the wrapper, never on the map element itself: Leaflet
        writes its own classes onto that node, and re-rendering it with a
        different className would strip them and break the map.
      */}
      <div
        style={{ height }}
        className="relative z-0 w-full overflow-hidden rounded-2xl border border-white/12"
      >
        <div ref={holder} className="h-full w-full" />

        {/*
          Full screen is its own page rather than a CSS overlay. Moving this
          element — into a portal or under a different parent — detaches
          Leaflet from it, and a card above uses backdrop-blur, which traps
          "fixed" inside itself. A fresh page sidesteps both.
        */}
        {expandable && !expanded && (
          <button type="button" onClick={() => setExpanded(true)}
            className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#141024]/95 px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.9)] backdrop-blur transition hover:bg-[#1e1836]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Bigger map
          </button>
        )}

        {fullHref && (
          <a href={fullHref}
            className="absolute right-3 top-3 z-[500] flex items-center gap-1.5 rounded-xl border border-white/20 bg-[#141024]/95 px-3.5 py-2 text-[12px] font-bold text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.9)] backdrop-blur transition hover:bg-[#1e1836]">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Expand
          </a>
        )}
      </div>

      {/* Spelled out under the map too — the corner control is easy to miss. */}
      {fullHref && (
        <a href={fullHref}
          className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-[13px] font-bold text-white/75 transition hover:bg-white/[0.1] hover:text-white">
          Open full screen map
        </a>
      )}

      {/*
        The big version is a SECOND map, rendered through a portal onto <body>.
        The map element itself is never moved — moving it detaches Leaflet —
        and going out to <body> escapes the card's backdrop-blur, which would
        otherwise trap "fixed" inside the card. Both maps edit the same spec,
        so whatever is drawn in here is already saved when it closes.
      */}
      {expanded && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[3000] flex flex-col bg-[#0b0713]">
          <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
            <div>
              <p className="font-display text-[15px] font-bold text-white">
                {spec.mode === "roads" ? "Drawing road runs" : "Drawing the delivery area"}
              </p>
              <p className="text-[12px] text-white/45">
                {points} point{points === 1 ? "" : "s"} — everything you draw here is kept
              </p>
            </div>
            <button type="button" onClick={() => setExpanded(false)}
              className="rounded-xl bg-gradient-to-r from-electric to-orchid px-5 py-2.5 font-display text-[13px] font-bold text-white">
              Done
            </button>
          </div>
          <div className="min-h-0 flex-1 px-3 pb-3">
            <BoundaryMap
              spec={spec}
              center={liveCenter()}
              editable={editable}
              height={Math.max(320, vh - 72)}
              onChange={(sp, c) => { setSpec(sp); specRef.current = sp; onChangeRef.current?.(sp, c); }}
            />
          </div>
        </div>,
        document.body,
      )}

      {locate && (
        <>
          {/* Far enough out that it needs saying loudly, not as a quiet chip. */}
          {outOfZone !== null && (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-rose-400/50 bg-rose-500/15 px-4 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-rose-500/25 text-[15px]">⚠</span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-bold text-rose-100">
                  You&apos;re not in the right area
                </span>
                <span className="mt-0.5 block text-[13px] text-rose-200/80">
                  {readable(outOfZone)} from {drawnArea.length >= 3 ? "your delivery area" : "your nearest road"} —
                  head back before you keep delivering.
                </span>
              </span>
              <button type="button" onClick={recentre}
                className="shrink-0 rounded-lg border border-rose-300/40 bg-rose-500/20 px-3 py-1.5 text-[12px] font-bold text-rose-100 transition hover:bg-rose-500/30">
                Show me
              </button>
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {me ? (
              <>
                <span className={`rounded-lg border px-3 py-1.5 text-[12px] font-bold ${
                  outOfZone !== null
                    ? "border-rose-400/40 bg-rose-500/10 text-rose-200"
                    : inZone
                      ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-300"
                      : "border-sky-400/35 bg-sky-500/10 text-sky-300"}`}>
                  {outOfZone !== null
                    ? `${readable(outOfZone)} away`
                    : inZone
                      ? drawnArea.length >= 3 ? "You're inside the area" : "You're on one of your roads"
                      : "Your location"}
                </span>
                <span className="text-[12px] text-white/35">accurate to about {Math.round(me.accuracy)} m</span>
                <button type="button" onClick={recentre}
                  className="ml-auto rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1]">
                  Where am I?
                </button>
              </>
            ) : (
              <span className="text-[12px] text-white/40">{geoErr || "Finding your location…"}</span>
            )}
          </div>
        </>
      )}

      {editable && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-white/45">
            {spec.mode === "area"
              ? points === 0
                ? "Click the map to trace the delivery area."
                : `${points} point${points === 1 ? "" : "s"} — click to add more.`
              : points === 0
                ? "Click along a road to mark it, then start the next one."
                : `${runs} road${runs === 1 ? "" : "s"}, ${points} point${points === 1 ? "" : "s"}.`}
          </span>
          {spec.mode === "roads" && (
            <button type="button" onClick={() => { newRunRef.current = true; setSpec({ ...specRef.current }); }}
              disabled={!points}
              className="rounded-lg border border-orchid/40 bg-orchid/10 px-3 py-1.5 text-[12px] font-bold text-orchid transition hover:bg-orchid/20 disabled:opacity-40">
              Finish road · start another
            </button>
          )}
          <button type="button" onClick={undo} disabled={!points}
            className="ml-auto rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1] disabled:opacity-40">
            Undo point
          </button>
          <button type="button" onClick={() => { newRunRef.current = false; emit({ ...spec, shapes: [], arrows: [] }); }}
            disabled={!points}
            className="rounded-lg border border-white/12 bg-white/[0.05] px-3 py-1.5 text-[12px] font-semibold text-white/70 transition hover:bg-white/[0.1] disabled:opacity-40">
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
