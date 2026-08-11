"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { baseStyle, keepMapSized, PLOT_COLORS } from "@/components/map/map-style";
import { ESTATES, getParcelCollection } from "@/data/estates";

/** A real, self-contained estate to preview — bundled data, so it never depends
 *  on the backend and always paints instantly on the landing page. */
const PREVIEW = ESTATES.find((e) => e.id === "oyibi-hillcrest") ?? ESTATES[0];

/**
 * Live satellite preview for the hero — a real MapLibre map showing an estate's
 * actual plots (coloured by status) that visitors can pan/zoom, with a CTA into
 * the full map browser. Replaces the old stylised SVG grid.
 */
export function HeroMap({ browseLabel, onBrowse }: { browseLabel: string; onBrowse: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !PREVIEW) return;
    const parcels = getParcelCollection(PREVIEW.id);
    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container: containerRef.current,
        style: baseStyle("satellite"),
        center: [PREVIEW.center.lng, PREVIEW.center.lat],
        zoom: PREVIEW.zoom ?? 16,
        attributionControl: { compact: true },
        // pan/zoom to explore, but never hijack the page's wheel-scroll
        scrollZoom: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
    } catch {
      return; // WebGL unavailable — the badges + CTA still show over the fallback
    }
    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      if (!parcels?.features.length) return;
      map.addSource("hero-parcels", { type: "geojson", data: parcels });
      map.addLayer({
        id: "hero-fill",
        type: "fill",
        source: "hero-parcels",
        paint: {
          "fill-color": ["match", ["get", "status"], "available", PLOT_COLORS.available, "reserved", PLOT_COLORS.reserved, PLOT_COLORS.sold],
          "fill-opacity": 0.45,
        },
      });
      map.addLayer({
        id: "hero-line",
        type: "line",
        source: "hero-parcels",
        paint: { "line-color": "#ffffff", "line-width": 1.2, "line-opacity": 0.85 },
      });
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const f of parcels.features) {
        for (const [x, y] of f.geometry.coordinates[0]) {
          if (x < minLng) minLng = x;
          if (x > maxLng) maxLng = x;
          if (y < minLat) minLat = y;
          if (y > maxLat) maxLat = y;
        }
      }
      if (Number.isFinite(minLng)) {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 36, maxZoom: 17.5, duration: 0 });
      }
    });

    const stopResize = keepMapSized(map, containerRef.current);
    mapRef.current = map;
    return () => {
      stopResize();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative mx-auto hidden w-full max-w-md lg:block">
      <div className="overflow-hidden rounded-3xl border border-secondary-foreground/15 shadow-2xl [transform:translateZ(0)]">
        <div ref={containerRef} className="h-[380px] w-full" role="application" aria-label="Live satellite map of land plots" />
      </div>

      {/* floating trust cues */}
      <div className="pointer-events-none absolute -top-4 right-6 flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-foreground shadow-lg">
        <span className="size-2 rounded-full bg-success" aria-hidden />
        <span className="text-xs font-semibold">Real plots · live satellite</span>
      </div>
      <div className="pointer-events-none absolute -bottom-4 left-6 flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-foreground shadow-lg">
        <BadgeCheck className="size-4 text-success" aria-hidden />
        <span className="text-xs font-semibold">Escrow protected · Title verified</span>
      </div>

      {/* browse CTA */}
      <div className="absolute top-3 left-3 z-10">
        <Button size="sm" className="shadow-lg" onClick={onBrowse}>
          {browseLabel} <ArrowRight data-icon="inline-end" />
        </Button>
      </div>

      {/* legend */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-3 rounded-full bg-background/90 px-3 py-1.5 text-[11px] text-foreground shadow-md backdrop-blur-sm">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: PLOT_COLORS.available }} aria-hidden /> Available</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: PLOT_COLORS.reserved }} aria-hidden /> Reserved</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm" style={{ background: PLOT_COLORS.sold }} aria-hidden /> Sold</span>
      </div>
    </div>
  );
}
