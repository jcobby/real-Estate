"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** Code-splits MapLibre — the checker only loads on the client. */
export const ConflictCheckerLoader = dynamic(
  () => import("./conflict-checker").then((m) => m.ConflictChecker),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-[32rem] rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    ),
  },
);
