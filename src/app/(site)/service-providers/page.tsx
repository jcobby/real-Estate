import type { Metadata } from "next";
import { ProvidersDirectory } from "@/components/providers/providers-directory";

export const metadata: Metadata = {
  title: "Service providers directory",
  description:
    "Find vetted surveyors, property managers, developers, electricians, plumbers, painters and photographers across Ghana.",
};

export default function ServiceProvidersPage() {
  return (
    <main className="page-container py-10">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight">Service providers</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Everything after the purchase — surveys, caretaking, building, wiring and more. Every provider carries
          real ratings from platform users.
        </p>
      </div>
      <div className="mt-8">
        <ProvidersDirectory />
      </div>
    </main>
  );
}
