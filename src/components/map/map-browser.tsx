"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Layers2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { baseStyle, keepMapSized, PLOT_COLORS } from "./map-style";
import { EstateSwitcher } from "./estate-switcher";
import { MapFilters, type PlotFilters } from "./map-filters";
import { MapLegend } from "./map-legend";
import { SelectionPanel } from "./selection-panel";
import { getEstates, getParcels } from "@/lib/api";
import { useSelection } from "@/stores/selection";
import type { Estate, ParcelCollection, ParcelProperties } from "@/types";

const SRC = "parcels";

export function MapBrowser() {
  const searchParams = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [basemap, setBasemap] = useState<"satellite" | "streets">("satellite");
  const [filters, setFilters] = useState<PlotFilters>({
    statuses: ["available", "reserved", "sold"],
    maxPrice: undefined,
    minSqm: undefined,
  });

  const selected = useSelection((s) => s.selected);
  const togglePlot = useSelection((s) => s.togglePlot);

  const { data: estates = [] } = useQuery({ queryKey: ["estates"], queryFn: getEstates });

  const { data: allParcels } = useQuery({
    queryKey: ["all-parcels"],
    queryFn: async () => {
      const list = await getEstates();
      const collections = await Promise.all(list.map((e) => getParcels(e.id)));
      const features = collections.flatMap((c) => c?.features ?? []);
      return { type: "FeatureCollection", features } satisfies ParcelCollection;
    },
  });

  const estateFromUrl = searchParams.get("estate");
  const initialEstate = useMemo<Estate | undefined>(
    () => estates.find((e) => e.id === estateFromUrl) ?? estates[0],
    [estates, estateFromUrl],
  );

  /* ---------------------------------------------------------------- */
  /* map lifecycle                                                     */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    if (!containerRef.current || mapRef.current || !initialEstate) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle("satellite"),
      center: [initialEstate.center.lng, initialEstate.center.lat],
      zoom: initialEstate.zoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      "top-right",
    );
    map.on("load", () => setMapReady(true));
    const stopResize = keepMapSized(map, containerRef.current);
    mapRef.current = map;
    return () => {
      stopResize();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [initialEstate]);

  /** (Re)attach parcel source + layers — runs on load and after style swaps. */
  const attachLayers = useCallback(
    (map: maplibregl.Map, data: ParcelCollection) => {
      if (map.getSource(SRC)) return;
      map.addSource(SRC, { type: "geojson", data, promoteId: "id" });

      map.addLayer({
        id: "plot-fill",
        type: "fill",
        source: SRC,
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            PLOT_COLORS.selected,
            [
              "match",
              ["get", "status"],
              "available",
              PLOT_COLORS.available,
              "reserved",
              PLOT_COLORS.reserved,
              PLOT_COLORS.sold,
            ],
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.75,
            ["match", ["get", "status"], "available", 0.4, 0.3],
          ],
        },
      });

      map.addLayer({
        id: "plot-outline",
        type: "line",
        source: SRC,
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ffffff",
            "rgba(255,255,255,0.75)",
          ],
          "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1.2],
        },
      });

      map.addLayer({
        id: "plot-labels",
        type: "symbol",
        source: SRC,
        minzoom: 15.6,
        layout: {
          "text-field": ["get", "plotNumber"],
          "text-font": ["Open Sans Semibold"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 15.6, 8, 17, 11, 19, 16],
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": "rgba(0,0,0,0.65)",
          "text-halo-width": 1.2,
        },
      });
    },
    [],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !allParcels) return;
    attachLayers(map, allParcels);
  }, [mapReady, allParcels, attachLayers]);

  /* clicking a plot */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const onClick = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["plot-fill"] });
      const feature = features[0];
      if (!feature) return;
      const props = feature.properties as unknown as ParcelProperties;
      if (props.status !== "available") {
        toast(`Plot ${props.plotNumber} is ${props.status === "sold" ? "unavailable for sale" : "reserved"}`, {
          description: props.status === "sold" ? `Owned by ${props.owner}.` : "Another buyer holds a reservation on it.",
        });
        return;
      }
      const estateName = estates.find((x) => x.id === props.estateId)?.name ?? props.estateId;
      // centroid of the outer ring, for "Get directions"
      const source = allParcels?.features.find((f) => f.properties.id === props.id);
      let lng: number | undefined;
      let lat: number | undefined;
      if (source) {
        const ring = source.geometry.coordinates[0];
        lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
        lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      }
      togglePlot({ ...props, estateName, lng, lat });
    };

    const onMove = (e: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["plot-fill"] });
      map.getCanvas().style.cursor = features.length ? "pointer" : "";
      if (!features.length) {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
        return;
      }
      const props = features[0].properties as unknown as ParcelProperties;
      const html = `<div style="padding:8px 12px;font-size:12px;line-height:1.5">
          <strong style="font-family:monospace">${props.plotNumber}</strong>
          · ${props.status === "available" ? "Available" : props.status === "reserved" ? "Reserved" : "Sold"}<br/>
          ${Math.round(props.areaSqm)} m² · ₵${Number(props.price).toLocaleString()}
        </div>`;
      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
        })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      } else {
        hoverPopupRef.current.setLngLat(e.lngLat).setHTML(html);
      }
    };

    map.on("click", onClick);
    map.on("mousemove", onMove);
    return () => {
      map.off("click", onClick);
      map.off("mousemove", onMove);
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    };
  }, [mapReady, estates, togglePlot, allParcels]);

  /* selection → feature-state */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getSource(SRC) || !allParcels) return;
    for (const f of allParcels.features) {
      map.setFeatureState({ source: SRC, id: f.properties.id }, { selected: false });
    }
    for (const p of selected) {
      map.setFeatureState({ source: SRC, id: p.id }, { selected: true });
    }
  }, [selected, mapReady, allParcels]);

  /* quick filters → layer filter */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !map.getLayer("plot-fill")) return;
    const expr: unknown[] = ["all", ["in", ["get", "status"], ["literal", filters.statuses]]];
    if (filters.maxPrice) expr.push(["<=", ["get", "price"], filters.maxPrice]);
    if (filters.minSqm) expr.push([">=", ["get", "areaSqm"], filters.minSqm]);
    for (const layer of ["plot-fill", "plot-outline", "plot-labels"]) {
      map.setFilter(layer, expr as never);
    }
  }, [filters, mapReady]);

  /* basemap swap keeps parcels attached */
  const swapBasemap = () => {
    const map = mapRef.current;
    if (!map || !allParcels) return;
    const next = basemap === "satellite" ? "streets" : "satellite";
    setBasemap(next);
    map.setStyle(baseStyle(next));
    map.once("styledata", () => {
      attachLayers(map, allParcels);
      // re-apply selection after style reload
      for (const p of useSelection.getState().selected) {
        map.setFeatureState({ source: SRC, id: p.id }, { selected: true });
      }
    });
  };

  const flyToEstate = (estate: Estate) => {
    mapRef.current?.flyTo({ center: [estate.center.lng, estate.center.lat], zoom: estate.zoom, duration: 2200 });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full [transform:translateZ(0)]" role="application" aria-label="Satellite map of land plots" />

      {/* top-left overlays */}
      <div className="absolute top-3 left-3 z-10 flex max-w-[calc(100%-6rem)] flex-col gap-2">
        <EstateSwitcher estates={estates} activeId={initialEstate?.id} onSelect={flyToEstate} />
        <div className="flex gap-2">
          <MapFilters filters={filters} onChange={setFilters} />
          <Button variant="secondary" size="sm" className="shadow-md" onClick={swapBasemap}>
            <Layers2 data-icon="inline-start" />
            {basemap === "satellite" ? "Streets" : "Satellite"}
          </Button>
        </div>
      </div>

      <MapLegend />

      <SelectionPanel
        onFocusPlot={(p) => {
          const feature = allParcels?.features.find((f) => f.properties.id === p.id);
          if (feature) {
            const [lng, lat] = feature.geometry.coordinates[0][0];
            mapRef.current?.flyTo({ center: [lng, lat], zoom: 17.5, duration: 1200 });
          }
        }}
      />
    </div>
  );
}
