import type { Metadata } from "next";
import { Suspense } from "react";
import { MaterialsBrowser } from "@/components/materials/materials-browser";
import { MaterialCardSkeleton } from "@/components/materials/material-card";

export const metadata: Metadata = {
  title: "Building materials & tools",
  description:
    "Buy cement, blocks, roofing, steel, plumbing, electrical, paint, tiles and tools — delivered to your site across Ghana. Everything you need to build on your land.",
};

export default function MaterialsPage() {
  return (
    <main className="page-container py-8">
      <Suspense
        fallback={
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <MaterialCardSkeleton key={i} />
            ))}
          </div>
        }
      >
        <MaterialsBrowser />
      </Suspense>
    </main>
  );
}
