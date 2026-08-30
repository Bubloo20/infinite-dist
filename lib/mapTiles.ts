/**
 * The basemap every map on the site draws on.
 *
 * This was CARTO's free tiles, which they've since put behind an API key —
 * anonymous requests still return a tile, but one with "API KEY REQUIRED"
 * printed across it, so the maps looked broken without failing. OpenStreetMap's
 * own tiles need no key and are fine at this scale, provided the attribution
 * below stays on the map.
 *
 * Set NEXT_PUBLIC_MAP_TILES (and optionally NEXT_PUBLIC_MAP_ATTRIBUTION) to
 * move to a paid provider later without touching any of the map code.
 */
export const TILE_URL =
  process.env.NEXT_PUBLIC_MAP_TILES || "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

export const TILE_ATTRIBUTION =
  process.env.NEXT_PUBLIC_MAP_ATTRIBUTION ||
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * OpenStreetMap has no tiles past zoom 19. Leaflet stretches the last real
 * level rather than showing blank squares, so the map still zooms in further.
 */
export const TILE_MAX_ZOOM = 20;
export const TILE_MAX_NATIVE_ZOOM = 19;
