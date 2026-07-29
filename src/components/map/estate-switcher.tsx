"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import type { Estate } from "@/types";
import { cn } from "@/lib/utils";

/** Jump between the seeded parcel areas across regions. */
export function EstateSwitcher({
  estates,
  activeId,
  onSelect,
}: {
  estates: Estate[];
  activeId?: string;
  onSelect: (estate: Estate) => void;
}) {
  const [active, setActive] = useState(activeId);

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5" role="group" aria-label="Estates">
      {estates.map((estate) => {
        const isActive = (active ?? activeId) === estate.id;
        return (
          <button
            key={estate.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              setActive(estate.id);
              onSelect(estate);
            }}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-left shadow-md backdrop-blur-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring",
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-transparent bg-background/90 hover:bg-background",
            )}
          >
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span>
              <span className="block text-xs leading-tight font-bold">{estate.name}</span>
              <span className={cn("block text-[10px] leading-tight", isActive ? "text-primary-foreground/80" : "text-muted-foreground")}>
                {estate.city} · {estate.region}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
