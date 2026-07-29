"use client";

import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { PlotStatus } from "@/types";
import { PLOT_STATUS_LABEL } from "@/components/shared/badges";

export interface PlotFilters {
  statuses: PlotStatus[];
  maxPrice?: number;
  minSqm?: number;
}

export function MapFilters({
  filters,
  onChange,
}: {
  filters: PlotFilters;
  onChange: (f: PlotFilters) => void;
}) {
  const activeCount =
    (filters.statuses.length < 3 ? 1 : 0) + (filters.maxPrice ? 1 : 0) + (filters.minSqm ? 1 : 0);

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="secondary" size="sm" className="shadow-md" />}>
        <SlidersHorizontal data-icon="inline-start" />
        Filters{activeCount > 0 ? ` (${activeCount})` : ""}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 space-y-4">
        <fieldset className="space-y-2.5">
          <legend className="text-sm font-semibold">Plot status</legend>
          {(["available", "reserved", "sold"] as PlotStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-2.5">
              <Checkbox
                id={`mf-${s}`}
                checked={filters.statuses.includes(s)}
                onCheckedChange={(v) =>
                  onChange({
                    ...filters,
                    statuses: v ? [...filters.statuses, s] : filters.statuses.filter((x) => x !== s),
                  })
                }
              />
              <Label htmlFor={`mf-${s}`} className="text-sm font-normal">
                {PLOT_STATUS_LABEL[s]}
              </Label>
            </div>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="mf-price">Max price (₵)</Label>
          <Input
            id="mf-price"
            type="number"
            min={0}
            placeholder="e.g. 90000"
            value={filters.maxPrice ?? ""}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value ? +e.target.value : undefined })}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mf-size">Min size (m²)</Label>
          <Input
            id="mf-size"
            type="number"
            min={0}
            placeholder="e.g. 600"
            value={filters.minSqm ?? ""}
            onChange={(e) => onChange({ ...filters, minSqm: e.target.value ? +e.target.value : undefined })}
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onChange({ statuses: ["available", "reserved", "sold"], maxPrice: undefined, minSqm: undefined })}
        >
          Reset filters
        </Button>
      </PopoverContent>
    </Popover>
  );
}
