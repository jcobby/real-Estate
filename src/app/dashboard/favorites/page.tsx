"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BellOff, BellRing, Bookmark, Heart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { getListingsByIds } from "@/lib/api";
import { useFavorites } from "@/stores/favorites";
import { timeAgo } from "@/lib/format";
import type { ListingFilters } from "@/types";

function searchHref(filters: ListingFilters) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.region) params.set("region", filters.region);
  if (filters.landStatus) params.set("landStatus", filters.landStatus);
  if (filters.minPrice != null) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice != null) params.set("maxPrice", String(filters.maxPrice));
  if (filters.verification) params.set("verification", filters.verification);
  return `/listings?${params}`;
}

export default function FavoritesPage() {
  const favorites = useFavorites((s) => s.favorites);
  const savedSearches = useFavorites((s) => s.savedSearches);
  const removeSavedSearch = useFavorites((s) => s.removeSavedSearch);
  const toggleSearchAlerts = useFavorites((s) => s.toggleSearchAlerts);

  const { data: listings, isPending } = useQuery({
    queryKey: ["favorites", favorites],
    queryFn: () => getListingsByIds(favorites),
    enabled: favorites.length > 0,
  });

  return (
    <div className="space-y-10">
      <section aria-label="Favorite listings">
        <h1 className="font-heading text-2xl font-bold tracking-tight">Favorites</h1>
        <p className="mt-1 text-sm text-muted-foreground">{favorites.length} saved listings</p>
        <div className="mt-6">
          {favorites.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nothing saved yet"
              description="Heart the listings you love and compare them here later."
              action={<Button render={<Link href="/listings" />}>Browse listings</Button>}
            />
          ) : isPending ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: Math.min(6, favorites.length) }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {listings?.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </section>

      <section aria-label="Saved searches">
        <h2 className="font-heading text-lg font-bold">Saved searches</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll alert you when new land matches a saved search.
        </p>
        <div className="mt-4">
          {savedSearches.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved searches"
              description='Use "Save search" on the listings page to store your filters.'
              className="py-10"
            />
          ) : (
            <ul className="space-y-3">
              {savedSearches.map((s) => (
                <Card key={s.id} className="flex-row items-center gap-4 rounded-2xl p-4">
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${s.alerts ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {s.alerts ? <BellRing className="size-4.5" aria-hidden /> : <BellOff className="size-4.5" aria-hidden />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={searchHref(s.filters)} className="truncate text-sm font-semibold hover:underline">
                      {s.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      Saved {timeAgo(s.createdAt)}
                      {s.filters.region ? ` · ${s.filters.region}` : ""}
                      {s.filters.maxPrice ? ` · under ₵${s.filters.maxPrice.toLocaleString()}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={s.alerts}
                      onCheckedChange={() => {
                        toggleSearchAlerts(s.id);
                        toast(s.alerts ? "Alerts paused" : "Alerts on", {
                          description: s.alerts ? undefined : "You'll be notified about new matches.",
                        });
                      }}
                      aria-label={`Toggle alerts for ${s.name}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete saved search ${s.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => {
                        removeSavedSearch(s.id);
                        toast("Saved search removed");
                      }}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </Card>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
