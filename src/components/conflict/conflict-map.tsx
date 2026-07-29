"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { baseStyle } from "@/components/map/map-style";
import type { ConflictResult, ParcelCollection } from "@/types";

const COLORS = {
  searcher: "#2563eb", // your land — blue
  conflict: "#f59e0b", // conflicting registered plot — amber
  overlap: "#ef4444", // the overlapping part — red
};

/**
 * Display-only map for Land Check. The boundary is supplied precisely (typed
 * coordinates or an uploaded GeoJSON/KML) — the map visualises your land, any
 * conflicting registered plot, and the exact overlap.
 */
export function ConflictMap({
  center,
  allParcels,
  boundary,
  result,
  focusNonce,
  flyTarget,
}: {
  center: { lat: number; lng: number };
  allParcels?: ParcelCollection | null;
  boundary: number[][] | null;
  result: ConflictResult | null;
  focusNonce: number;
  /** change nonce to fly the map to a searched place / current location */
  flyTarget?: { lat: number; lng: number; zoom?: number; nonce: number } | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [ready, setReady] = useState(false);

  /* ---- map lifecycle ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle("satellite"),
      center: [center.lng, center.lat],
      zoom: 16.2,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: false }),
      "top-right",
    );
    map.on("load", () => setReady(true));
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- attach sources + layers once ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || map.getSource("context")) return;
    const empty = { type: "FeatureCollection", features: [] } as GeoJSON.FeatureCollection;

    map.addSource("context", { type: "geojson", data: empty });
    map.addLayer({ id: "context-line", type: "line", source: "context", paint: { "line-color": "#fff", "line-opacity": 0.45, "line-width": 1 } });

    map.addSource("conflict", { type: "geojson", data: empty });
    map.addLayer({ id: "conflict-fill", type: "fill", source: "conflict", paint: { "fill-color": COLORS.conflict, "fill-opacity": 0.15 } });
    map.addLayer({ id: "conflict-line", type: "line", source: "conflict", paint: { "line-color": COLORS.conflict, "line-width": 2.5 } });

    map.addSource("searcher", { type: "geojson", data: empty });
    map.addLayer({ id: "searcher-fill", type: "fill", source: "searcher", paint: { "fill-color": COLORS.searcher, "fill-opacity": 0.22 } });
    map.addLayer({ id: "searcher-line", type: "line", source: "searcher", paint: { "line-color": COLORS.searcher, "line-width": 3 } });

    map.addSource("overlap", { type: "geojson", data: empty });
    map.addLayer({ id: "overlap-fill", type: "fill", source: "overlap", paint: { "fill-color": COLORS.overlap, "fill-opacity": 0.6 } });
    map.addLayer({ id: "overlap-line", type: "line", source: "overlap", paint: { "line-color": COLORS.overlap, "line-width": 2 } });
  }, [ready]);

  /* ---- render boundary + result ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const poly = (ring: number[][]): GeoJSON.Feature => ({ type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [ring] } });

    (map.getSource("searcher") as maplibregl.GeoJSONSource | undefined)?.setData(
      boundary ? { type: "FeatureCollection", features: [poly(boundary)] } : { type: "FeatureCollection", features: [] },
    );

    const conflictFeatures = (result?.conflicts ?? []).flatMap((c) => {
      const pf = allParcels?.features.find((f) => f.properties.id === c.parcelId);
      return pf ? [poly(pf.geometry.coordinates[0])] : [];
    });
    (map.getSource("conflict") as maplibregl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: conflictFeatures });

    const overlapFeatures = (result?.conflicts ?? []).flatMap((c) => c.overlapRings.map((r) => poly(r)));
    (map.getSource("overlap") as maplibregl.GeoJSONSource | undefined)?.setData({ type: "FeatureCollection", features: overlapFeatures });
  }, [boundary, result, allParcels, ready]);

  /* ---- context (registered parcels for orientation) ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !allParcels) return;
    (map.getSource("context") as maplibregl.GeoJSONSource | undefined)?.setData(allParcels);
  }, [allParcels, ready]);

  /* ---- fly to boundary when set ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !boundary || boundary.length < 3) return;
    let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
    for (const [x, y] of boundary) {
      if (x < minLng) minLng = x;
      if (x > maxLng) maxLng = x;
      if (y < minLat) minLat = y;
      if (y > maxLat) maxLat = y;
    }
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 90, maxZoom: 18, duration: 900 });
  }, [focusNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---- fly to a searched place / current location ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyTarget) return;
    map.flyTo({ center: [flyTarget.lng, flyTarget.lat], zoom: flyTarget.zoom ?? 16.5, duration: 1400 });
  }, [flyTarget?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="relative">
        <div ref={containerRef} className="h-[26rem] w-full" role="application" aria-label="Land conflict map" />
        {!boundary && (
          <span className="pointer-events-none absolute top-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/90 px-3.5 py-1.5 text-[11px] font-medium shadow-md backdrop-blur-sm">
            Your land appears here once you enter coordinates or upload a file
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-card px-4 py-2.5 text-xs text-muted-foreground">
        {[
          { c: COLORS.searcher, l: "Your land" },
          { c: COLORS.conflict, l: "Registered plot" },
          { c: COLORS.overlap, l: "Overlap / conflict" },
        ].map((i) => (
          <span key={i.l} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm" style={{ backgroundColor: i.c }} aria-hidden />
            {i.l}
          </span>
        ))}
      </div>
    </div>
  );
}
