import type { Metadata } from "next";
import { Suspense } from "react";
import { MapBrowserLoader } from "@/components/map/map-browser-loader";

export const metadata: Metadata = {
  title: "Map browse — pick your exact plot from the sky",
  description:
    "Shop for land directly on a live satellite map. Tap available plots to select them, see plot numbers, owners, sizes and prices, then buy with escrow protection.",
};

export default function MapPage() {
  return (
    <main className="relative h-[calc(100vh-4rem)] h-[calc(100dvh-4rem)] w-full overflow-hidden">
      <Suspense fallback={<div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
        <MapBrowserLoader />
      </Suspense>
    </main>
  );
}
