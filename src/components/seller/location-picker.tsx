"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Check, MapPin as MapPinIcon, PenLine, Undo2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { baseStyle, PLOT_COLORS } from "@/components/map/map-style";
import { ringAreaSqm } from "@/lib/geo";
import { formatSqm } from "@/lib/format";
import type { ParcelCollection } from "@/types";

const SRC = "wizard-parcels";
const DRAW_SRC = "wizard-draw";
const EMPTY: ParcelCollection = { type: "FeatureCollection", features: [] };

type LngLat = [number, number];

/**
 * Order corner points around their centroid so tapping them in any order
 * (even reading order: TL, TR, BL, BR) yields a clean, non-self-intersecting
 * polygon instead of a bow-tie. Correct for the convex plots land sellers draw.
 */
function orderRing(points: LngLat[]): LngLat[] {
  if (points.length < 3) return points;
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cy = points.reduce((s, p) => s + p[1], 0) / points.length;
  return [...points].sort((a, b) => Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx));
}

/**
 * Step-1 wizard map:
 * - click to drop the listing pin
 * - "Draw plot" mode: click each corner of the land to trace its boundary,
 *   see the lines + live area, Finish → it becomes a selectable parcel
 * - live preview of every configured/uploaded/drawn parcel, exactly as buyers see it
 */
export function LocationPicker({
  lat,
  lng,
  parcels,
  allowDraw = false,
  readOnly = false,
  drawnCount = 0,
  focusTarget,
  onChange,
  onDrawParcel,
}: {
  lat?: number;
  lng?: number;
  parcels?: ParcelCollection | null;
  allowDraw?: boolean;
  /** preview only — no location pin, no tap-to-place, no footer hint */
  readOnly?: boolean;
  /** how many plots are already drawn — tunes the on-map button label */
  drawnCount?: number;
  /** change nonce to fly the map to a place (search / use-my-location) */
  focusTarget?: { lat: number; lng: number; zoom?: number; nonce: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
  onDrawParcel?: (ring: LngLat[]) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const lastParcelCountRef = useRef(0);

  const [drawing, setDrawing] = useState(false);
  // vertices live in state for rendering; the ref mirror feeds the map's stable event handlers
  const [vertices, setVertices] = useState<LngLat[]>([]);
  const drawingRef = useRef(false);
  const verticesRef = useRef<LngLat[]>([]);
  const setVerts = useCallback((next: LngLat[]) => {
    verticesRef.current = next;
    setVertices(next);
  }, []);

  const onChangeRef = useRef(onChange);
  const onDrawParcelRef = useRef(onDrawParcel);
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    onChangeRef.current = onChange;
    onDrawParcelRef.current = onDrawParcel;
    readOnlyRef.current = readOnly;
  }, [onChange, onDrawParcel, readOnly]);

  /* ------------------------- draw-mode helpers ------------------------- */

  const renderDrawProgress = useCallback((map: maplibregl.Map) => {
    const vertices = verticesRef.current;
    // corner dots stay where tapped; the boundary + fill follow the ordered ring
    const ring = orderRing(vertices);
    const features: GeoJSON.Feature[] = vertices.map((v) => ({
      type: "Feature",
      properties: { kind: "vertex" },
      geometry: { type: "Point", coordinates: v },
    }));
    if (vertices.length === 2) {
      features.push({
        type: "Feature",
        properties: { kind: "line" },
        geometry: { type: "LineString", coordinates: vertices },
      });
    }
    if (vertices.length >= 3) {
      features.push({
        type: "Feature",
        properties: { kind: "line" },
        geometry: { type: "LineString", coordinates: [...ring, ring[0]] },
      });
      features.push({
        type: "Feature",
        properties: { kind: "area" },
        geometry: { type: "Polygon", coordinates: [[...ring, ring[0]]] },
      });
    }
    (map.getSource(DRAW_SRC) as maplibregl.GeoJSONSource | undefined)?.setData({
      type: "FeatureCollection",
      features,
    });
  }, []);

  const ensureDrawLayers = useCallback((map: maplibregl.Map) => {
    if (map.getSource(DRAW_SRC)) return;
    map.addSource(DRAW_SRC, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
    map.addLayer({
      id: `${DRAW_SRC}-fill`,
      type: "fill",
      source: DRAW_SRC,
      filter: ["==", ["get", "kind"], "area"],
      paint: { "fill-color": PLOT_COLORS.selected, "fill-opacity": 0.3 },
    });
    map.addLayer({
      id: `${DRAW_SRC}-line`,
      type: "line",
      source: DRAW_SRC,
      filter: ["==", ["get", "kind"], "line"],
      paint: { "line-color": PLOT_COLORS.selected, "line-width": 2.5, "line-dasharray": [1.5, 1] },
    });
    map.addLayer({
      id: `${DRAW_SRC}-points`,
      type: "circle",
      source: DRAW_SRC,
      filter: ["==", ["get", "kind"], "vertex"],
      paint: {
        "circle-radius": 5,
        "circle-color": PLOT_COLORS.selected,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
  }, []);

  const stopDrawing = useCallback((keepToast = false) => {
    const map = mapRef.current;
    drawingRef.current = false;
    setDrawing(false);
    setVerts([]);
    if (map) {
      renderDrawProgress(map);
      map.doubleClickZoom.enable();
      map.getCanvas().style.cursor = "";
    }
    if (!keepToast) toast.dismiss("draw-hint");
  }, [renderDrawProgress, setVerts]);

  const finishDrawing = useCallback(() => {
    // drop consecutive duplicates (a double-click adds its point twice)
    const vertices = verticesRef.current.filter(
      (v, i, arr) => i === 0 || Math.hypot(v[0] - arr[i - 1][0], v[1] - arr[i - 1][1]) > 1e-7,
    );
    if (vertices.length < 3) {
      toast.error("A plot needs at least 3 corners", { description: "Keep clicking the boundary, then Finish." });
      return;
    }
    const ordered = orderRing(vertices);
    const ring: LngLat[] = [...ordered, ordered[0]];
    onDrawParcelRef.current?.(ring);
    stopDrawing();
  }, [stopDrawing]);

  const startDrawing = () => {
    const map = mapRef.current;
    if (!map) return;
    ensureDrawLayers(map);
    drawingRef.current = true;
    setDrawing(true);
    setVerts([]);
    map.doubleClickZoom.disable();
    map.getCanvas().style.cursor = "crosshair";
    toast("Trace your plot", {
      id: "draw-hint",
      description: "Click each corner of the land. Double-click (or hit Finish) to close the boundary.",
      duration: 8000,
    });
  };

  const undoVertex = () => {
    const map = mapRef.current;
    setVerts(verticesRef.current.slice(0, -1));
    if (map) renderDrawProgress(map);
  };

  /* ------------------------- map lifecycle ------------------------- */

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start: [number, number] = [lng ?? -0.187, lat ?? 5.65];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle("satellite"),
      center: start,
      zoom: lat != null ? 15 : 6.2,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("click", (e) => {
      if (drawingRef.current) {
        ensureDrawLayers(map);
        setVerts([...verticesRef.current, [e.lngLat.lng, e.lngLat.lat]]);
        renderDrawProgress(map);
        return;
      }
      if (readOnlyRef.current) return; // preview map — no location pin
      const coords = { lat: +e.lngLat.lat.toFixed(6), lng: +e.lngLat.lng.toFixed(6) };
      if (!markerRef.current) {
        markerRef.current = new maplibregl.Marker({ color: "#ffae00" }).setLngLat(e.lngLat).addTo(map);
      } else {
        markerRef.current.setLngLat(e.lngLat);
      }
      onChangeRef.current(coords);
    });

    map.on("dblclick", (e) => {
      if (drawingRef.current) {
        e.preventDefault();
        finishDrawing();
      }
    });

    if (!readOnly && lat != null && lng != null) {
      markerRef.current = new maplibregl.Marker({ color: "#ffae00" }).setLngLat([lng, lat]).addTo(map);
    }
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* keep the pin in sync when coordinates are typed in manually */
  useEffect(() => {
    const map = mapRef.current;
    if (readOnly || !map || lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
    if (!markerRef.current) {
      markerRef.current = new maplibregl.Marker({ color: "#ffae00" }).setLngLat([lng, lat]).addTo(map);
    } else {
      markerRef.current.setLngLat([lng, lat]);
    }
  }, [lat, lng, readOnly]);

  /* fly to a searched place / current location */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusTarget) return;
    map.flyTo({ center: [focusTarget.lng, focusTarget.lat], zoom: focusTarget.zoom ?? 16, duration: 1400 });
  }, [focusTarget?.nonce]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Attach (once) then update the parcel-preview layers. */
  const applyParcels = useCallback((map: maplibregl.Map, fc: ParcelCollection) => {
    const existing = map.getSource(SRC) as maplibregl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(fc);
      return;
    }
    map.addSource(SRC, { type: "geojson", data: fc });
    map.addLayer({
      id: `${SRC}-fill`,
      type: "fill",
      source: SRC,
      paint: {
        "fill-color": [
          "match",
          ["get", "status"],
          "available",
          PLOT_COLORS.available,
          "reserved",
          PLOT_COLORS.reserved,
          PLOT_COLORS.sold,
        ],
        "fill-opacity": 0.35,
      },
    });
    map.addLayer({
      id: `${SRC}-line`,
      type: "line",
      source: SRC,
      paint: { "line-color": "#ffffff", "line-width": 1.5, "line-opacity": 0.9 },
    });
    map.addLayer({
      id: `${SRC}-labels`,
      type: "symbol",
      source: SRC,
      minzoom: 15.2,
      layout: {
        "text-field": ["get", "plotNumber"],
        "text-font": ["Open Sans Semibold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 15.2, 8, 17, 11, 19, 15],
      },
      paint: {
        "text-color": "#ffffff",
        "text-halo-color": "rgba(0,0,0,0.65)",
        "text-halo-width": 1.2,
      },
    });
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const fc = parcels ?? EMPTY;
    const apply = () => {
      applyParcels(map, fc);
      const hadNone = lastParcelCountRef.current === 0;
      lastParcelCountRef.current = fc.features.length;
      if (!fc.features.length) return;
      let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
      for (const f of fc.features) {
        for (const [x, y] of f.geometry.coordinates[0]) {
          if (x < minLng) minLng = x;
          if (x > maxLng) maxLng = x;
          if (y < minLat) minLat = y;
          if (y > maxLat) maxLat = y;
        }
      }
      const center = map.getCenter();
      const off = Math.hypot(center.lng - (minLng + maxLng) / 2, center.lat - (minLat + maxLat) / 2);
      // always fly when parcels first appear (e.g. right after a file upload)
      if (hadNone || off > 0.004 || map.getZoom() < 13) {
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, maxZoom: 17, duration: 900 });
      }
    };
    // "idle" always fires again — never rely on the one-shot "load" event
    if (map.isStyleLoaded()) apply();
    else map.once("idle", apply);
  }, [parcels, applyParcels]);

  /* live area readout while tracing */
  const liveArea =
    drawing && vertices.length >= 3
      ? ringAreaSqm((() => {
          const r = orderRing(vertices);
          return [...r, r[0]];
        })())
      : null;

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="relative">
        <div ref={containerRef} className="h-96 w-full" role="application" aria-label="Plot location and parcel preview map" />

        {allowDraw && !drawing && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <Button type="button" size="sm" className="shadow-lg" onClick={startDrawing}>
              <PenLine data-icon="inline-start" /> {drawnCount > 0 ? "Draw another plot" : "Draw a plot"}
            </Button>
            {drawnCount > 0 && (
              <span className="rounded-full bg-background/90 px-2.5 py-1 text-[11px] font-semibold shadow-md backdrop-blur-sm">
                {drawnCount} drawn
              </span>
            )}
          </div>
        )}

        {allowDraw && drawing && (
          <>
            {/* active-drawing banner so the user always knows what to do next */}
            <div className="absolute inset-x-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-xl bg-secondary/95 px-3 py-2 text-secondary-foreground shadow-lg backdrop-blur-sm">
              <span className="text-xs font-semibold">
                {vertices.length === 0
                  ? "Tap each corner of your land — any order is fine"
                  : vertices.length < 3
                    ? `${vertices.length} corner${vertices.length > 1 ? "s" : ""} placed — tap the rest`
                    : `${vertices.length} corners${liveArea != null ? ` · ≈ ${formatSqm(liveArea)}` : ""} — Finish when it looks right`}
              </span>
              <span className="ml-auto flex items-center gap-1.5">
                <Button type="button" size="xs" variant="secondary" onClick={undoVertex} disabled={vertices.length === 0}>
                  <Undo2 data-icon="inline-start" /> Undo
                </Button>
                <Button type="button" size="xs" variant="secondary" onClick={() => stopDrawing()}>
                  <X data-icon="inline-start" /> Cancel
                </Button>
                <Button type="button" size="xs" onClick={finishDrawing} disabled={vertices.length < 3}>
                  <Check data-icon="inline-start" /> Finish
                </Button>
              </span>
            </div>
            <span className="pointer-events-none absolute bottom-14 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-[11px] font-medium shadow-md backdrop-blur-sm">
              Double-click the last corner to finish
            </span>
          </>
        )}
      </div>
      {!drawing && !readOnly && (
        <p className="flex items-center gap-1.5 bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5 shrink-0" aria-hidden />
          Tap the map to drop your location pin{allowDraw ? " — or “Draw a plot” to trace a boundary" : ""}.
          {parcels?.features.length
            ? ` Showing ${parcels.features.length} plot${parcels.features.length > 1 ? "s" : ""} as buyers will see them.`
            : ""}
        </p>
      )}
    </div>
  );
}
