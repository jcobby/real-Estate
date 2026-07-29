"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Grid2x2, MapPin, Ruler } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LandStatusBadge, VerificationBadge } from "@/components/shared/badges";
import { FavoriteButton } from "@/components/shared/favorite-button";
import type { Listing } from "@/types";
import { formatGHS, formatNumber, formatPlots } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ListingCard({ listing, className }: { listing: Listing; className?: string }) {
  return (
    <Card className={cn("group relative gap-0 overflow-hidden rounded-2xl p-0 transition-shadow hover:shadow-lg", className)}>
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={listing.images[0]}
          alt={listing.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex flex-col items-start gap-1.5">
            <VerificationBadge status={listing.verification} />
            <LandStatusBadge status={listing.landStatus} />
          </div>
          <FavoriteButton listingId={listing.id} className="relative z-10" />
        </div>
        {listing.estateId && (
          <span className="absolute bottom-3 left-3 rounded-full bg-secondary/90 px-2.5 py-1 text-[11px] font-semibold text-secondary-foreground backdrop-blur-sm">
            <Grid2x2 className="mr-1 inline size-3" aria-hidden />
            Pick plots on map
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <p className="font-heading text-lg font-bold text-foreground">
          {formatGHS(listing.price)}
          <span className="ml-1 text-xs font-medium text-muted-foreground">/ plot</span>
        </p>
        <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
          <Link href={`/property/${listing.id}`} className="outline-none after:absolute after:inset-0 focus-visible:underline">
            {listing.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">
            {listing.city} · {listing.region}
          </span>
        </p>
        <div className="mt-1 flex items-center gap-3 border-t pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Ruler className="size-3.5" aria-hidden />
            {listing.sizeAcres} acres
          </span>
          <span className="inline-flex items-center gap-1">
            <Grid2x2 className="size-3.5" aria-hidden />
            {formatPlots(listing.plotsAvailable)} left
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {formatNumber(listing.views)}
          </span>
        </div>
      </div>
    </Card>
  );
}

export function ListingCardSkeleton() {
  return (
    <Card className="gap-0 overflow-hidden rounded-2xl p-0">
      <div className="aspect-[4/3] animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-28 animate-pulse rounded bg-muted" />
        <div className="h-4 w-full animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-3.5 w-full animate-pulse rounded bg-muted" />
      </div>
    </Card>
  );
}
