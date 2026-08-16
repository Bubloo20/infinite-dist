import { NextResponse } from "next/server";
import { currentSession } from "@/lib/portal/auth";

export const dynamic = "force-dynamic";

const UA = "InfiniteDistribution/1.0 (letterbox distribution portal; infinitemelb.online)";

/** Melbourne, roughly — bias results here instead of hitting streets interstate. */
const VIEWBOX = "144.5,-38.4,145.6,-37.4";

/**
 * Street lookup for the delivery-area map. This only moves the map to a place —
 * boundaries are always drawn by hand. Proxied rather than called from the
 * browser so the request carries a User-Agent identifying this app, as
 * OpenStreetMap's usage policy asks.
 */
export async function GET(req: Request) {
  if (!currentSession()) {
    return NextResponse.json({ ok: false, error: "Not signed in." }, { status: 401 });
  }

  const q = (new URL(req.url).searchParams.get("q") || "").trim();
  if (q.length < 3) return NextResponse.json({ ok: true, results: [] });

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", /\b(vic|victoria|australia)\b/i.test(q) ? q : `${q}, Victoria, Australia`);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("countrycodes", "au");
    url.searchParams.set("limit", "8");
    url.searchParams.set("viewbox", VIEWBOX);
    url.searchParams.set("bounded", "0");
    // Structured address parts — the only way to tell four Porter Roads apart.
    url.searchParams.set("addressdetails", "1");

    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "en-AU" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return NextResponse.json({ ok: false, error: "Search is unavailable right now." }, { status: 502 });

    const rows = (await res.json()) as Array<{
      lat: string; lon: string; display_name?: string; name?: string;
      addresstype?: string; boundingbox?: [string, string, string, string];
      address?: Record<string, string>;
    }>;

    const results = rows
      .map((r) => {
        const lat = Number(r.lat);
        const lng = Number(r.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        const a = r.address || {};
        // "12 Porter Road" for an address, "Porter Road" for the street itself.
        const street = a.road || r.name || "";
        const short = [a.house_number, street].filter(Boolean).join(" ") ||
          (r.display_name || "").split(",")[0].trim();
        // Which Porter Road — the suburb is what tells them apart.
        const where = a.suburb || a.village || a.town || a.city_district || a.city || a.municipality || "";
        const context = [where, a.postcode].filter(Boolean).join(" ");

        const bb = r.boundingbox?.map(Number);
        return {
          label: r.display_name || short || q,
          short,
          context,
          kind: a.house_number ? "address" : r.addresstype || "",
          lat,
          lng,
          // [south, north, west, east] -> a box the map can fit to.
          box: bb && bb.length === 4 && bb.every(Number.isFinite)
            ? ([[bb[0], bb[2]], [bb[1], bb[3]]] as [[number, number], [number, number]])
            : null,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, results });
  } catch {
    return NextResponse.json({ ok: false, error: "Search failed." }, { status: 500 });
  }
}
