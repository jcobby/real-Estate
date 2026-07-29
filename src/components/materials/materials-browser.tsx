"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PackagePlus, PackageSearch, Search, Store, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { MaterialCard, MaterialCardSkeleton } from "./material-card";
import { CATEGORY_META } from "./category-meta";
import { MATERIAL_CATEGORIES } from "@/data/materials";
import { getMaterials } from "@/lib/api";
import type { MaterialFilters } from "@/types";
import { cn } from "@/lib/utils";

const SORT_ITEMS = [
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "rating", label: "Top rated" },
];

export function MaterialsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const category = (searchParams.get("category") as MaterialFilters["category"]) ?? "all";
  const sort = (searchParams.get("sort") as MaterialFilters["sort"]) ?? "popular";
  const q = searchParams.get("q") ?? "";
  const [qInput, setQInput] = useState(q);

  const filters: MaterialFilters = useMemo(() => ({ q: q || undefined, category, sort }), [q, category, sort]);

  const apply = (patch: Partial<{ category: string; sort: string; q: string }>) => {
    const params = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === "all" || (k === "sort" && v === "popular")) params.delete(k);
      else params.set(k, v);
    }
    router.replace(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["materials", filters],
    queryFn: () => getMaterials(filters),
  });

  return (
    <div>
      <div className="rounded-3xl bg-secondary p-6 text-secondary-foreground sm:p-8">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <Truck className="size-3.5" aria-hidden /> Delivered to your site
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Building materials &amp; tools</h1>
        <p className="mt-2 max-w-xl text-sm text-secondary-foreground/80">
          Everything you need to build on your land — cement, blocks, roofing, steel, plumbing, tiles and tools, from
          trusted suppliers across Ghana.
        </p>
        <form
          className="relative mt-5 max-w-lg"
          onSubmit={(e) => {
            e.preventDefault();
            apply({ q: qInput.trim() });
          }}
        >
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Label htmlFor="mat-q" className="sr-only">
            Search materials
          </Label>
          <Input
            id="mat-q"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Search cement, rods, tiles, drill…"
            className="h-11 bg-background pl-9 text-foreground"
          />
        </form>
        <p className="mt-3 text-xs text-secondary-foreground/80">
          Supply building materials?{" "}
          <Link href="/register/seller?next=/seller/materials" className="font-semibold text-primary hover:underline">
            List your products →
          </Link>
        </p>
      </div>

      {/* category chips */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Material categories">
        <button
          role="tab"
          aria-selected={category === "all"}
          onClick={() => apply({ category: "all" })}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            category === "all" ? "border-transparent bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          All
        </button>
        {MATERIAL_CATEGORIES.map((c) => {
          const Icon = CATEGORY_META[c.value].icon;
          return (
            <button
              key={c.value}
              role="tab"
              aria-selected={category === c.value}
              onClick={() => apply({ category: c.value })}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                category === c.value ? "border-transparent bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {c.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {isPending ? "Loading…" : `${data?.length ?? 0} products`}
        </p>
        <div>
          <Label htmlFor="mat-sort" className="sr-only">
            Sort
          </Label>
          <Select items={SORT_ITEMS} value={sort ?? "popular"} onValueChange={(v) => apply({ sort: v as string })}>
            <SelectTrigger id="mat-sort" className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_ITEMS.map((i) => (
                <SelectItem key={i.value} value={i.value}>
                  {i.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {isError ? (
          <EmptyState
            icon={PackageSearch}
            title="Couldn't load materials"
            action={<Button onClick={() => refetch()}>Try again</Button>}
          />
        ) : isPending ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MaterialCardSkeleton key={i} />
            ))}
          </div>
        ) : data!.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="No products match"
            description="Try another category or clear your search."
            action={
              <Button variant="outline" onClick={() => { setQInput(""); router.replace(pathname, { scroll: false }); }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {data!.map((m) => (
              <MaterialCard key={m.id} material={m} />
            ))}
          </div>
        )}
      </div>

      {/* supplier CTA */}
      <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border bg-sidebar p-8 text-center sm:flex-row sm:text-left">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Store className="size-6" aria-hidden />
        </span>
        <div className="flex-1">
          <h2 className="font-heading text-lg font-bold">Sell building materials on RealEstate</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reach builders and land owners across Ghana. List your products in minutes and get paid on delivery.
          </p>
        </div>
        <Button size="lg" render={<Link href="/register/seller?next=/seller/materials" />}>
          <PackagePlus data-icon="inline-start" /> Become a supplier
        </Button>
      </div>
    </div>
  );
}
