import Link from "next/link";
import { ArrowRight, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="page-container pt-6 pb-20">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-warning px-6 py-14 text-center text-primary-foreground sm:px-14">
        <div className="topo-bg absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-2xl">
          <h2 className="font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Your plot is waiting on the map
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
            Open the satellite view, tap the plots you want, and buy with escrow protection — verified titles,
            transparent pricing, zero surprises.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              className="h-12 bg-secondary px-6 text-secondary-foreground hover:bg-secondary/85"
              render={<Link href="/map" />}
            >
              <Map data-icon="inline-start" /> Browse the map
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-primary-foreground/30 bg-transparent px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              render={<Link href="/register" />}
            >
              Create a free account <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
