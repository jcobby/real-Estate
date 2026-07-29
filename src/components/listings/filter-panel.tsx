"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { ListingFilters } from "@/types";
import { LAND_STATUS_LABEL } from "@/components/shared/badges";
import { cn } from "@/lib/utils";

const REGIONS = [
  "Greater Accra",
  "Ashanti",
  "Eastern",
  "Northern",
  "Central",
  "Volta",
  "Western",
  "Upper West",
];

const AMENITIES = [
  "Electricity on site",
  "Piped water",
  "Tarred road access",
  "Gated community",
  "Walled & demarcated",
  "Street lights",
];

const VERIFICATION_ITEMS = [
  { value: "all", label: "Any verification" },
  { value: "verified", label: "Verified only" },
  { value: "pending", label: "Pending" },
  { value: "unverified", label: "Unverified" },
];

const SELLER_ITEMS = [
  { value: "all", label: "Any seller" },
  { value: "developer", label: "Developer" },
  { value: "agent", label: "Agent" },
  { value: "owner", label: "Owner" },
];

export function FilterPanel({
  filters,
  onChange,
  onClear,
  className,
}: {
  filters: ListingFilters;
  onChange: (patch: Partial<ListingFilters>) => void;
  onClear: () => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-bold tracking-wide uppercase">Filters</h2>
        <Button variant="ghost" size="sm" onClick={onClear}>
          Clear all
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-region">Region</Label>
        <Select
          items={[{ value: "all", label: "All regions" }, ...REGIONS.map((r) => ({ value: r, label: r }))]}
          value={filters.region ?? "all"}
          onValueChange={(v) => onChange({ region: v === "all" ? undefined : (v as string) })}
        >
          <SelectTrigger id="f-region" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {REGIONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Land status</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Land status">
          {(["all", "developed", "semi-developed", "greenfield", "undeveloped"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={(filters.landStatus ?? "all") === s}
              onClick={() => onChange({ landStatus: s === "all" ? undefined : s })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                (filters.landStatus ?? "all") === s
                  ? "border-transparent bg-secondary text-secondary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {s === "all" ? "Any" : LAND_STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Price (₵ per plot)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="f-minprice" className="sr-only">
              Minimum price
            </Label>
            <Input
              id="f-minprice"
              type="number"
              min={0}
              placeholder="Min"
              value={filters.minPrice ?? ""}
              onChange={(e) => onChange({ minPrice: e.target.value ? +e.target.value : undefined })}
            />
          </div>
          <div>
            <Label htmlFor="f-maxprice" className="sr-only">
              Maximum price
            </Label>
            <Input
              id="f-maxprice"
              type="number"
              min={0}
              placeholder="Max"
              value={filters.maxPrice ?? ""}
              onChange={(e) => onChange({ maxPrice: e.target.value ? +e.target.value : undefined })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Size (acres)</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="f-minacres" className="sr-only">
              Minimum acres
            </Label>
            <Input
              id="f-minacres"
              type="number"
              min={0}
              step="0.1"
              placeholder="Min"
              value={filters.minAcres ?? ""}
              onChange={(e) => onChange({ minAcres: e.target.value ? +e.target.value : undefined })}
            />
          </div>
          <div>
            <Label htmlFor="f-maxacres" className="sr-only">
              Maximum acres
            </Label>
            <Input
              id="f-maxacres"
              type="number"
              min={0}
              step="0.1"
              placeholder="Max"
              value={filters.maxAcres ?? ""}
              onChange={(e) => onChange({ maxAcres: e.target.value ? +e.target.value : undefined })}
            />
          </div>
        </div>
      </div>

      <Separator />

      <fieldset className="space-y-2.5">
        <legend className="text-sm font-medium">Amenities</legend>
        {AMENITIES.map((a) => {
          const checked = filters.amenities?.includes(a) ?? false;
          return (
            <div key={a} className="flex items-center gap-2.5">
              <Checkbox
                id={`am-${a}`}
                checked={checked}
                onCheckedChange={(value) => {
                  const current = filters.amenities ?? [];
                  onChange({
                    amenities: value ? [...current, a] : current.filter((x) => x !== a),
                  });
                }}
              />
              <Label htmlFor={`am-${a}`} className="text-sm font-normal text-muted-foreground">
                {a}
              </Label>
            </div>
          );
        })}
      </fieldset>

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="f-verification">Verification</Label>
        <Select
          items={VERIFICATION_ITEMS}
          value={filters.verification ?? "all"}
          onValueChange={(v) =>
            onChange({ verification: v === "all" ? undefined : (v as ListingFilters["verification"]) })
          }
        >
          <SelectTrigger id="f-verification" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {VERIFICATION_ITEMS.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="f-seller">Seller type</Label>
        <Select
          items={SELLER_ITEMS}
          value={filters.sellerType ?? "all"}
          onValueChange={(v) =>
            onChange({ sellerType: v === "all" ? undefined : (v as ListingFilters["sellerType"]) })
          }
        >
          <SelectTrigger id="f-seller" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SELLER_ITEMS.map((i) => (
              <SelectItem key={i.value} value={i.value}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
