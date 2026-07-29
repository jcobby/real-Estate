import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { ConflictCheckerLoader } from "@/components/conflict/conflict-checker-loader";

export const metadata: Metadata = {
  title: "Land Check — is this plot already someone else's?",
  description:
    "Draw or upload a land boundary and instantly see whether it overlaps any registered plot on RealEstate. Free for members, pay-as-you-go for guests.",
};

export default function LandCheckPage() {
  return (
    <main className="page-container py-8">
      <div className="mb-6 max-w-2xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          <ShieldAlert className="size-3.5" aria-hidden /> Fraud &amp; double-sale protection
        </p>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Land Check</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Mark your land on the map — we instantly show whether it clashes with a plot that&apos;s already
          registered. New here? Tap <span className="font-medium text-foreground">Try an example</span> to see it work.
        </p>
      </div>
      <ConflictCheckerLoader />
    </main>
  );
}
