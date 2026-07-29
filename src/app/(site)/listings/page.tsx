import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingsBrowser } from "@/components/listings/listings-browser";
import { ListingCardSkeleton } from "@/components/listings/listing-card";

export const metadata: Metadata = {
  title: "Browse land & property for sale",
  description:
    "Search verified land and property across Ghana. Filter by region, price in cedis, land status, size and amenities — then switch to the satellite map to pick exact plots.",
};

export default function ListingsPage() {
  return (
    <main className="page-container py-8">
      <Suspense
        fallback={
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ListingCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <ListingsBrowser />
      </Suspense>
    </main>
  );
}
