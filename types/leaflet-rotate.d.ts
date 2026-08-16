import "leaflet";

/**
 * Rotation for Leaflet, which core Leaflet doesn't do. The plugin patches the
 * Map prototype on import and ships no types of its own, so this declares the
 * module and augments the options we set.
 *
 * The `import` above matters: without it this file wouldn't be a module, and
 * `declare module "leaflet"` would replace Leaflet's own types instead of
 * adding to them. The plugin's own module declaration sits in a sibling file
 * for the opposite reason — it has to be ambient.
 */
declare module "leaflet" {
  interface MapOptions {
    /** Allow the map to be turned off north. */
    rotate?: boolean;
    /** Two-finger twist on a touchscreen. */
    touchRotate?: boolean;
    /** Shift and drag with a mouse. */
    shiftKeyRotate?: boolean;
    rotateControl?: boolean | { closeOnZeroBearing?: boolean; position?: string };
    /** Starting bearing, in degrees. */
    bearing?: number;
  }

  interface Map {
    setBearing?(degrees: number): this;
    getBearing?(): number;
  }
}
