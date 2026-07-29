import type { StyleSpecification } from "maplibre-gl";

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

/** Plot polygon colors keyed by status (used by fill layers + legends). */
export const PLOT_COLORS = {
  available: "#34d399",
  reserved: "#f97316", // orange — clearly apart from the gold selection tint
  sold: "#94a3b8",
  selected: "#ffae00",
} as const;
