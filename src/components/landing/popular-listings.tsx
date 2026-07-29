"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, SearchX } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { Button } from "@/components/ui/button";
import { getFeaturedListings } from "@/lib/api";
import { cn } from "@/lib/utils";

const TABS = [
  { value: "all", label: "All" },
  { value: "developed", label: "Developed" },
  { value: "semi-developed", label: "Semi-developed" },
  { value: "greenfield", label: "Greenfield" },
  { value: "undeveloped", label: "Undeveloped" },
];

export function PopularListings() {
  const [status, setStatus] = useState("all");
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["featured-listings", status],
    queryFn: () => getFeaturedListings(status),
  });

  return (
    <section className="border-y bg-sidebar py-16 sm:py-24">
      <div className="page-container">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            kicker="Popular right now"
            title="The most viewed land this week"
            subtitle="Filter by how developed the land is — from ready-to-build estates to raw acreage."
          />
          <Button variant="ghost" className="text-primary hover:text-primary" render={<Link href="/listings" />}>
            View all listings <ArrowRight data-icon="inline-end" />
          </Button>
        </div>

        <div role="tablist" aria-label="Filter by land status" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => setStatus(tab.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                status === tab.value
                  ? "border-transparent bg-secondary text-secondary-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isError ? (
          <EmptyState
            className="mt-6"
            icon={SearchX}
            title="Couldn't load listings"
            description="Something went wrong fetching popular land."
            action={<Button variant="outline" onClick={() => refetch()}>Try again</Button>}
          />
        ) : (
          <div className="no-scrollbar mt-6 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2">
            {isPending
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="w-72 shrink-0 snap-start">
                    <ListingCardSkeleton />
                  </div>
                ))
              : data!.map((listing) => (
                  <div key={listing.id} className="w-72 shrink-0 snap-start">
                    <ListingCard listing={listing} />
                  </div>
                ))}
            {!isPending && data!.length === 0 && (
              <EmptyState
                className="w-full"
                icon={SearchX}
                title="No land in this category yet"
                description="Try another land status or browse everything."
                action={<Button variant="outline" render={<Link href="/listings" />}>Browse all</Button>}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
