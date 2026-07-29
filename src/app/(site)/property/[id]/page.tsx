import type { Metadata } from "next";
import { getListing } from "@/lib/api";
import { PropertyDetail } from "@/components/property/property-detail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) return { title: "Listing not found" };
  return {
    title: listing.title,
    description: `${listing.city}, ${listing.region} — ${listing.sizeAcres} acres from ₵${listing.price.toLocaleString()} per plot. ${listing.description.slice(0, 140)}`,
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 200),
      images: [{ url: listing.images[0] }],
    },
  };
}

export default async function PropertyPage({ params }: Props) {
  const { id } = await params;
  return (
    <main className="page-container py-8">
      <PropertyDetail id={id} />
    </main>
  );
}
