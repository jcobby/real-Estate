"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Map as MapIcon,
  Search,
  SearchX,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterPanel } from "./filter-panel";
import { ListingCard, ListingCardSkeleton } from "./listing-card";
import { RecentlyViewed } from "./recently-viewed";
import { getListings } from "@/lib/api";
import { useFavorites } from "@/stores/favorites";
import { useSession } from "@/stores/session";
import type { ListingFilters } from "@/types";

const ListingsMap = dynamic(() => import("./listings-map").then((m) => m.ListingsMap), {
  ssr: false,
  loading: () => <Skeleton className="h-[540px] w-full rounded-2xl" />,
});

const SORT_ITEMS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low → high" },
  { value: "price-desc", label: "Price: high → low" },
  { value: "size-desc", label: "Largest size" },
  { value: "most-viewed", label: "Most viewed" },
];

function parseFilters(params: URLSearchParams): ListingFilters {
  const num = (k: string) => (params.get(k) ? Number(params.get(k)) : undefined);
  return {
    q: params.get("q") ?? undefined,
    region: params.get("region") ?? undefined,
    landStatus: (params.get("landStatus") as ListingFilters["landStatus"]) ?? undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    minAcres: num("minAcres"),
    maxAcres: num("maxAcres"),
    amenities: params.get("amenities")?.split("|").filter(Boolean) ?? undefined,
    verification: (params.get("verification") as ListingFilters["verification"]) ?? undefined,
    sellerType: (params.get("sellerType") as ListingFilters["sellerType"]) ?? undefined,
    sort: (params.get("sort") as ListingFilters["sort"]) ?? "newest",
    page: num("page") ?? 1,
  };
}

function serializeFilters(f: ListingFilters, view: string): string {
  const params = new URLSearchParams();
  if (f.q) params.set("q", f.q);
  if (f.region) params.set("region", f.region);
  if (f.landStatus) params.set("landStatus", f.landStatus);
  if (f.minPrice != null) params.set("minPrice", String(f.minPrice));
  if (f.maxPrice != null) params.set("maxPrice", String(f.maxPrice));
  if (f.minAcres != null) params.set("minAcres", String(f.minAcres));
  if (f.maxAcres != null) params.set("maxAcres", String(f.maxAcres));
  if (f.amenities?.length) params.set("amenities", f.amenities.join("|"));
  if (f.verification) params.set("verification", f.verification);
  if (f.sellerType) params.set("sellerType", f.sellerType);
  if (f.sort && f.sort !== "newest") params.set("sort", f.sort);
  if (f.page && f.page > 1) params.set("page", String(f.page));
  if (view !== "grid") params.set("view", view);
  return params.toString();
}

export function ListingsBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams)), [searchParams]);
  const view = searchParams.get("view") === "map" ? "map" : "grid";
  const [qInput, setQInput] = useState(filters.q ?? "");
  const [saveOpen, setSaveOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { session } = useSession();
  const saveSearch = useFavorites((s) => s.saveSearch);

  const apply = useCallback(
    (patch: Partial<ListingFilters>, nextView?: string) => {
      const next = { ...filters, page: 1, ...patch };
      router.replace(`${pathname}?${serializeFilters(next, nextView ?? view)}`, { scroll: false });
    },
    [filters, pathname, router, view],
  );

  const clear = () => {
    setQInput("");
    router.replace(pathname, { scroll: false });
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["listings", filters],
    queryFn: () => getListings(filters),
  });

  const activeFilterCount = [
    filters.region,
    filters.landStatus,
    filters.minPrice,
    filters.maxPrice,
    filters.minAcres,
    filters.maxAcres,
    filters.verification,
    filters.sellerType,
    ...(filters.amenities ?? []),
  ].filter((x) => x != null).length;

  return (
    <div>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Browse land &amp; property</h1>
            <p className="mt-1 text-sm text-muted-foreground" aria-live="polite">
              {isPending ? "Searching…" : `${data?.total ?? 0} listings${filters.region ? ` in ${filters.region}` : " across Ghana"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!session) {
                  toast("Sign in to save searches", { description: "Your saved searches live in your buyer dashboard." });
                  router.push("/login");
                  return;
                }
                setSaveOpen(true);
              }}
            >
              <BookmarkPlus data-icon="inline-start" /> Save search
            </Button>
            <div className="flex rounded-lg border p-0.5" role="group" aria-label="View mode">
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={view === "grid"}
                onClick={() => apply({}, "grid")}
              >
                <LayoutGrid data-icon="inline-start" /> Grid
              </Button>
              <Button
                variant={view === "map" ? "secondary" : "ghost"}
                size="sm"
                aria-pressed={view === "map"}
                onClick={() => apply({}, "map")}
              >
                <MapIcon data-icon="inline-start" /> Map
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <form
            className="relative min-w-0 flex-1 sm:max-w-md"
            onSubmit={(e) => {
              e.preventDefault();
              apply({ q: qInput.trim() || undefined });
            }}
          >
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Label htmlFor="listings-q" className="sr-only">
              Search by location or keyword
            </Label>
            <Input
              id="listings-q"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Search location, e.g. Oyibi, Aburi, Tamale…"
              className="h-10 pl-9"
            />
          </form>

          <Sheet>
            <SheetTrigger render={<Button variant="outline" className="lg:hidden" />}>
              <SlidersHorizontal data-icon="inline-start" />
              Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-8">
                <FilterPanel filters={filters} onChange={apply} onClear={clear} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="ml-auto">
            <Label htmlFor="listings-sort" className="sr-only">
              Sort listings
            </Label>
            <Select
              items={SORT_ITEMS}
              value={filters.sort ?? "newest"}
              onValueChange={(v) => apply({ sort: v as ListingFilters["sort"] })}
            >
              <SelectTrigger id="listings-sort" className="w-44">
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
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-2xl border bg-card p-5">
            <FilterPanel filters={filters} onChange={apply} onClear={clear} />
          </div>
        </aside>

        <div>
          {isError ? (
            <EmptyState
              icon={SearchX}
              title="Couldn't load listings"
              description="The search service hiccuped. Give it another try."
              action={<Button onClick={() => refetch()}>Try again</Button>}
            />
          ) : view === "map" ? (
            <ListingsMap listings={data?.items ?? []} loading={isPending} />
          ) : isPending ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : data!.items.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="No land matches those filters"
              description="Try widening the price range or clearing a few filters."
              action={
                <Button variant="outline" onClick={clear}>
                  Clear all filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {data!.items.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {data!.totalPages > 1 && (
                <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Previous page"
                    disabled={data!.page <= 1}
                    onClick={() => apply({ page: data!.page - 1 })}
                  >
                    <ChevronLeft />
                  </Button>
                  {Array.from({ length: data!.totalPages }).map((_, i) => (
                    <Button
                      key={i}
                      variant={data!.page === i + 1 ? "secondary" : "ghost"}
                      size="icon-sm"
                      aria-current={data!.page === i + 1 ? "page" : undefined}
                      onClick={() => apply({ page: i + 1 })}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Next page"
                    disabled={data!.page >= data!.totalPages}
                    onClick={() => apply({ page: data!.page + 1 })}
                  >
                    <ChevronRight />
                  </Button>
                </nav>
              )}
            </>
          )}

          <RecentlyViewed excludeIds={data?.items.map((l) => l.id) ?? []} />
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save this search</DialogTitle>
            <DialogDescription>
              We&apos;ll keep these filters in your dashboard and alert you when new matching land is listed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="search-name">Name</Label>
            <Input
              id="search-name"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={filters.region ? `Land in ${filters.region}` : "e.g. Plots under ₵100k"}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const name =
                  searchName.trim() ||
                  (filters.region ? `Land in ${filters.region}` : filters.q ? `"${filters.q}"` : "My search");
                saveSearch(name, filters);
                setSaveOpen(false);
                setSearchName("");
                toast.success("Search saved", { description: "Manage it under Dashboard → Favorites." });
              }}
            >
              Save search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
