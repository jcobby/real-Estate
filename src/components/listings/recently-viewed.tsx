"use client";

import { useQuery } from "@tanstack/react-query";
import { History } from "lucide-react";
import { ListingCard } from "./listing-card";
import { getListingsByIds } from "@/lib/api";
import { useFavorites } from "@/stores/favorites";

export function RecentlyViewed({ excludeIds = [] }: { excludeIds?: string[] }) {
  const recentlyViewed = useFavorites((s) => s.recentlyViewed);
  const ids = recentlyViewed.filter((id) => !excludeIds.includes(id)).slice(0, 4);

  const { data } = useQuery({
    queryKey: ["recently-viewed", ids],
    queryFn: () => getListingsByIds(ids),
    enabled: ids.length > 0,
  });

  if (!data?.length) return null;

  return (
    <section aria-label="Recently viewed" className="mt-12 border-t pt-8">
      <h2 className="flex items-center gap-2 font-heading text-lg font-bold">
        <History className="size-5 text-primary" aria-hidden />
        Recently viewed
      </h2>
      <div className="no-scrollbar mt-4 flex snap-x gap-5 overflow-x-auto pb-2">
        {data.map((listing) => (
          <div key={listing.id} className="w-64 shrink-0 snap-start">
            <ListingCard listing={listing} />
          </div>
        ))}
      </div>
    </section>
  );
}
