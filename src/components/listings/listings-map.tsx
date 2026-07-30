"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { baseStyle, keepMapSized } from "@/components/map/map-style";
import { formatGHS } from "@/lib/format";
import type { Listing } from "@/types";

/** Map view of the current search results — markers stay in sync with filters. */
export function ListingsMap({ listings, loading }: { listings: Listing[]; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: baseStyle("streets"),
      center: [-1.0232, 7.3],
      zoom: 5.8,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    const stopResize = keepMapSized(map, containerRef.current);
    mapRef.current = map;
    return () => {
      stopResize();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!listings.length) return;
    const bounds = new maplibregl.LngLatBounds();

    for (const listing of listings) {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", `${listing.title} — ${formatGHS(listing.price)}`);
      el.className =
        "cursor-pointer rounded-full border-2 border-white bg-[#ffae00] px-2.5 py-1 text-xs font-bold text-[#3d2e00] shadow-md transition-transform hover:scale-110";
      el.textContent = formatGHS(listing.price, { compact: true });

      const popup = new maplibregl.Popup({ offset: 14, maxWidth: "260px" }).setHTML(
        `<div style="font-family:inherit;padding:12px 14px;min-width:200px">
           <p style="margin:0;font-weight:700;font-size:13px;line-height:1.35">${listing.title}</p>
           <p style="margin:4px 0 0;font-size:12px;color:#667">${listing.city} · ${listing.region}</p>
           <p style="margin:6px 0 0;font-weight:700;font-size:13px">${formatGHS(listing.price)} <span style="font-weight:400;color:#667">/ plot</span></p>
           <a href="/property/${listing.id}" style="display:inline-block;margin-top:8px;font-size:12px;font-weight:600;color:#b47a00;text-decoration:underline">View details →</a>
         </div>`,
      );

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([listing.coords.lng, listing.coords.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([listing.coords.lng, listing.coords.lat]);
    }

    map.fitBounds(bounds, { padding: 70, maxZoom: 13, duration: 600 });
  }, [listings]);

  return (
    <div className="relative overflow-hidden rounded-2xl border">
      <div ref={containerRef} className="h-135 w-full [transform:translateZ(0)]" role="application" aria-label="Map of search results" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <p className="rounded-full bg-background px-4 py-2 text-sm font-medium shadow">Updating results…</p>
        </div>
      )}
    </div>
  );
}
