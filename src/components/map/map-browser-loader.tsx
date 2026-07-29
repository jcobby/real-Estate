"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Code-splits MapLibre — it only loads when the map page is opened. */
export const MapBrowserLoader = dynamic(() => import("./map-browser").then((m) => m.MapBrowser), {
  ssr: false,
  loading: () => (
    <div className="relative h-full w-full">
      <Skeleton className="h-full w-full rounded-none" />
      <p className="absolute inset-0 flex items-center justify-center text-sm font-medium text-muted-foreground">
        Preparing satellite view…
      </p>
    </div>
  ),
});
