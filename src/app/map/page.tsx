import type { Metadata } from "next";
import { Suspense } from "react";
import { MapBrowserLoader } from "@/components/map/map-browser-loader";
import { SiteFooter } from "@/components/layout/site-footer";

export const metadata: Metadata = {
  title: "Map browse — pick your exact plot from the sky",
  description:
    "Shop for land directly on a live satellite map. Tap available plots to select them, see plot numbers, owners, sizes and prices, then buy with escrow protection.",
};

export default function MapPage() {
  return (
    <>
      {/* a tall map section (not the whole viewport) so the page still scrolls,
          revealing the footer below — the map keeps its own overflow for the canvas */}
      <main className="relative h-[80vh] h-[80dvh] min-h-[520px] w-full overflow-hidden">
        <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
          <MapBrowserLoader />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}
