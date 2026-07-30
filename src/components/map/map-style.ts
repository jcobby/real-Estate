import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";

/**
 * Free raster base layers — satellite (Esri World Imagery) and streets (OSM).
 * Glyphs come from the MapLibre demo tiles server for plot-number labels.
 */
export function baseStyle(kind: "satellite" | "streets"): StyleSpecification {
  return {
    version: 8,
    glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
    sources: {
      base:
        kind === "satellite"
          ? {
              type: "raster",
              tiles: [
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              ],
              tileSize: 256,
              maxzoom: 19,
              attribution: "Imagery © Esri, Maxar, Earthstar Geographics",
            }
          : {
              type: "raster",
              tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
              tileSize: 256,
              maxzoom: 19,
              attribution: "© OpenStreetMap contributors",
            },
    },
    layers: [{ id: "base", type: "raster", source: "base" }],
  };
}

/**
 * Keep the WebGL canvas sized to its container. Safari (and any late-layout
 * pass) can create the map before the container has its final size, leaving a
 * 0×0 / blank canvas until the user interacts — a few deferred resizes plus a
 * ResizeObserver fix it. Returns a cleanup to call on unmount.
 */
export function keepMapSized(map: MapLibreMap, container: HTMLElement): () => void {
  const resize = () => {
    try {
      map.resize();
    } catch {
      /* map already removed */
    }
  };
  map.once("load", resize);
  const timers = [60, 250, 800].map((ms) => setTimeout(resize, ms));
  const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  ro?.observe(container);
  return () => {
    timers.forEach(clearTimeout);
    ro?.disconnect();
  };
}

/** Plot polygon colors keyed by status (used by fill layers + legends). */
export const PLOT_COLORS = {
  available: "#34d399",
  reserved: "#f97316", // orange — clearly apart from the gold selection tint
  sold: "#94a3b8",
  selected: "#ffae00",
} as const;
