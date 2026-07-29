"use client";

import Link from "next/link";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingWizard } from "@/components/seller/listing-wizard";
import { getListing } from "@/lib/api";

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: listing, isPending } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => getListing(id),
  });

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[480px] rounded-2xl" />
      </div>
    );
  }

  if (!listing) {
    return (
      <EmptyState
        icon={SearchX}
        title="Listing not found"
        description="It may have been removed."
        action={<Button render={<Link href="/seller/listings" />}>Back to listings</Button>}
      />
    );
  }

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-3" render={<Link href="/seller/listings" />}>
        <ArrowLeft data-icon="inline-start" /> My listings
      </Button>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Edit listing</h1>
      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{listing.title}</p>
      <div className="mt-6">
        <ListingWizard listing={listing} />
      </div>
    </div>
  );
}
