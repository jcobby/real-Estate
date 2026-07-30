"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Expand, MousePointerClick, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { baseStyle, keepMapSized, PLOT_COLORS } from "@/components/map/map-style";
import { PLOT_STATUS_LABEL } from "@/components/shared/badges";
import { getEstates, getParcels } from "@/lib/api";
import { useSelection } from "@/stores/selection";
import { useSession } from "@/stores/session";
import { formatAcres, formatGHS, formatSqft } from "@/lib/format";
import type { ParcelProperties } from "@/types";

const SRC = "parcels";

/**
 * Interactive parcel map on the property page: buyers tap available plots to
 * select them (shared with the /map page via the selection store) and buy them
 * right here — no need to leave for the full-screen map.
 */
export function ParcelPreview({ estateId }: { estateId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const hoverPopupRef = useRef<maplibregl.Popup | null>(null);
  const [ready, setReady] = useState(false);

  const selected = useSelection((s) => s.selected);
  const togglePlot = useSelection((s) => s.togglePlot);
  const removePlot = useSelection((s) => s.removePlot);
  const estateSelected = selected.filter((p) => p.estateId === estateId);

  const { data: estates } = useQuery({ queryKey: ["estates"], queryFn: getEstates });
  const { data: parcels } = useQuery({
    queryKey: ["parcels", estateId],
    queryFn: () => getParcels(estateId),
  });
  const estate = estates?.find((e) => e.id === estateId);
  const availableCount = parcels?.features.filter((f) => f.properties.status === "available").length ?? 0;

  useEffect(() => {
    if (!containerRef.current || !estate || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle("satellite"),
      center: [estate.center.lng, estate.center.lat],
      zoom: estate.zoom,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("load", () => setReady(true));
    const stopResize = keepMapSized(map, containerRef.current);
    mapRef.current = map;
    return () => {
      stopResize();
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, [estate]);

  /* attach parcel layers */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !parcels || map.getSource(SRC)) return;
    map.addSource(SRC, { type: "geojson", data: parcels, promoteId: "id" });
    map.addLayer({
      id: "parcels-fill",
      type: "fill",
      source: SRC,
      paint: {
        "fill-color": [
          "case",
          ["boolean", ["feature-state", "selected"], false],
          PLOT_COLORS.selected,
          ["match", ["get", "status"], "available", PLOT_COLORS.available, "reserved", PLOT_COLORS.reserved, PLOT_COLORS.sold],
        ],
        "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0.75, ["match", ["get", "status"], "available", 0.4, 0.3]],
      },
    });
    map.addLayer({
      id: "parcels-line",
      type: "line",
      source: SRC,
      paint: {
        "line-color": ["case", ["boolean", ["feature-state", "selected"], false], "#ffffff", "rgba(255,255,255,0.7)"],
        "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 1.2],
      },
    });
    map.addLayer({
      id: "parcels-labels",
      type: "symbol",
      source: SRC,
      minzoom: 15.4,
      layout: {
        "text-field": ["get", "plotNumber"],
        "text-font": ["Open Sans Semibold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 15.4, 8, 18, 12],
      },
      paint: { "text-color": "#fff", "text-halo-color": "rgba(0,0,0,0.65)", "text-halo-width": 1.2 },
    });
  }, [ready, parcels]);

  /* click + hover */
  const onClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      const map = mapRef.current!;
      const feature = map.queryRenderedFeatures(e.point, { layers: ["parcels-fill"] })[0];
      if (!feature) return;
      const props = feature.properties as unknown as ParcelProperties;
      if (props.status !== "available") {
        toast(`Plot ${props.plotNumber} is ${PLOT_STATUS_LABEL[props.status].toLowerCase()}`, {
          description: props.status === "sold" ? `Owned by ${props.owner}.` : "Another buyer holds a reservation on it.",
        });
        return;
      }
      const source = parcels?.features.find((f) => f.properties.id === props.id);
      let lng: number | undefined;
      let lat: number | undefined;
      if (source) {
        const ring = source.geometry.coordinates[0];
        lng = ring.reduce((s, c) => s + c[0], 0) / ring.length;
        lat = ring.reduce((s, c) => s + c[1], 0) / ring.length;
      }
      togglePlot({ ...props, estateName: estate?.name ?? estateId, lng, lat });
    },
    [parcels, estate, estateId, togglePlot],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const move = (e: maplibregl.MapMouseEvent) => {
      const f = map.queryRenderedFeatures(e.point, { layers: ["parcels-fill"] })[0];
      map.getCanvas().style.cursor = f ? "pointer" : "";
      if (!f) {
        hoverPopupRef.current?.remove();
        hoverPopupRef.current = null;
        return;
      }
      const p = f.properties as unknown as ParcelProperties;
      const html = `<div style="padding:8px 12px;font-size:12px;line-height:1.5"><strong style="font-family:monospace">${p.plotNumber}</strong> · ${PLOT_STATUS_LABEL[p.status]}<br/>${Math.round(p.areaSqm)} m² · ₵${Number(p.price).toLocaleString()}</div>`;
      if (!hoverPopupRef.current) {
        hoverPopupRef.current = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 8 }).setLngLat(e.lngLat).setHTML(html).addTo(map);
      } else {
        hoverPopupRef.current.setLngLat(e.lngLat).setHTML(html);
      }
    };
    map.on("click", onClick);
    map.on("mousemove", move);
    return () => {
      map.off("click", onClick);
      map.off("mousemove", move);
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
    };
  }, [ready, onClick]);

  /* selection → feature-state */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !parcels || !map.getSource(SRC)) return;
    for (const f of parcels.features) {
      map.setFeatureState({ source: SRC, id: f.properties.id }, { selected: selected.some((p) => p.id === f.properties.id) });
    }
  }, [selected, ready, parcels]);

  const totalSqm = estateSelected.reduce((s, p) => s + p.areaSqm, 0);
  const totalPrice = estateSelected.reduce((s, p) => s + p.price, 0);

  const buy = () => {
    if (!session) {
      toast("Sign in to buy land", { description: "Your selected plots are kept — sign in and continue to checkout." });
      router.push("/login?next=/checkout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="overflow-hidden rounded-2xl border">
      <div className="relative">
        <div ref={containerRef} className="h-96 w-full [transform:translateZ(0)]" role="application" aria-label={`Interactive plot map for ${estate?.name ?? "estate"}`} />
        <div className="pointer-events-none absolute top-3 left-3 rounded-full bg-background/90 px-3 py-1.5 text-[11px] font-semibold shadow-md backdrop-blur-sm">
          Tap a green plot to select it
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="absolute right-3 bottom-3 shadow-md"
          render={<Link href={`/map?estate=${estateId}`} />}
        >
          <Expand data-icon="inline-start" /> Full-screen map
        </Button>
      </div>

      {/* legend + live selection summary */}
      <div className="space-y-3 border-t bg-card p-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {[
            { c: PLOT_COLORS.available, l: "Available" },
            { c: PLOT_COLORS.reserved, l: "Reserved" },
            { c: PLOT_COLORS.sold, l: "Sold" },
            { c: PLOT_COLORS.selected, l: "Selected" },
          ].map((i) => (
            <span key={i.l} className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm border border-white/50" style={{ backgroundColor: i.c }} aria-hidden />
              {i.l}
            </span>
          ))}
          <span className="ml-auto font-medium text-foreground">{availableCount} available</span>
        </div>

        {estateSelected.length === 0 ? (
          <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
            <MousePointerClick className="size-4 shrink-0 text-primary" aria-hidden />
            Tap the exact plots you want on the map, then buy them together with escrow protection.
          </p>
        ) : (
          <div className="rounded-xl border bg-muted/30 p-3">
            <div className="flex flex-wrap gap-1.5">
              {estateSelected.map((p) => (
                <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-primary/15 py-1 pr-1 pl-2.5 text-xs font-semibold text-accent-foreground">
                  <span className="font-mono">{p.plotNumber}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${p.plotNumber}`}
                    className="flex size-4 items-center justify-center rounded-full hover:bg-background/60"
                    onClick={() => removePlot(p.id)}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                </span>
              ))}
            </div>
            <dl className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-t pt-3">
              <div className="text-xs text-muted-foreground">
                <dt className="inline">Total land · </dt>
                <dd className="inline font-medium text-foreground">
                  {formatSqft(totalSqm)} ({formatAcres(totalSqm)})
                </dd>
              </div>
              <p className="font-heading text-lg font-bold">{formatGHS(totalPrice)}</p>
            </dl>
            <Button className="mt-3 h-11 w-full" onClick={buy}>
              <ShoppingCart data-icon="inline-start" /> Buy {estateSelected.length} plot{estateSelected.length > 1 ? "s" : ""} · {formatGHS(totalPrice)}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
