import type { Metadata } from "next";
import { ListingWizard } from "@/components/seller/listing-wizard";

export const metadata: Metadata = { title: "New listing" };

export default function NewListingPage() {
  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Create a listing</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Seven quick steps — your progress autosaves as you go.
      </p>
      <div className="mt-6">
        <ListingWizard />
      </div>
    </div>
  );
}
