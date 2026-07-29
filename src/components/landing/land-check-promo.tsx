import Link from "next/link";
import { ArrowRight, MousePointerClick, ScanSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const BLUE = "#2563eb";
const AMBER = "#f59e0b";
const RED = "#ef4444";

/**
 * Landing spotlight for Land Check — the platform's signature safety feature.
 * The illustration mirrors the real result: your boundary (blue) overlapping a
 * registered plot (amber), with the exact overlap in red.
 */
export function LandCheckPromo() {
  return (
    <section className="page-container py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-primary/8 via-card to-card p-8 shadow-sm sm:p-12">
        <div
          className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_0.9fr]">
          {/* copy */}
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <ShieldCheck className="size-3.5" aria-hidden /> Before you pay
            </p>
            <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-4xl">
              Land Check — make sure it isn&apos;t already sold
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
              Mark a boundary on the satellite map and see in seconds whether it overlaps a plot that&apos;s
              already registered — the #1 way buyers get double-sold.
            </p>

            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: MousePointerClick, label: "Draw your boundary" },
                { icon: ScanSearch, label: "See overlaps instantly" },
                { icon: ShieldCheck, label: "Free for members" },
              ].map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2.5 text-sm font-medium">
                  <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="h-12 px-6 text-base" render={<Link href="/land-check" />}>
                <ShieldCheck data-icon="inline-start" /> Run a free Land Check
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-6 text-base" render={<Link href="/land-check?example=1" />}>
                See a live example <ArrowRight data-icon="inline-end" />
              </Button>
            </div>
          </div>

          {/* overlap illustration */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="rounded-2xl border bg-card p-4 shadow-lg">
              <svg viewBox="0 0 320 230" className="w-full rounded-xl bg-muted/40" role="img" aria-label="Your boundary overlapping a registered plot, with the overlap highlighted">
                {/* faint estate grid */}
                <g stroke="currentColor" strokeOpacity={0.08} fill="none">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <line key={`v${i}`} x1={20 + i * 46} y1={16} x2={20 + i * 46} y2={214} />
                  ))}
                  {Array.from({ length: 5 }).map((_, i) => (
                    <line key={`h${i}`} x1={16} y1={20 + i * 46} x2={304} y2={20 + i * 46} />
                  ))}
                </g>

                {/* registered plot (amber) */}
                <rect x={40} y={70} width={140} height={110} rx={6} fill={AMBER} fillOpacity={0.14} stroke={AMBER} strokeWidth={2.5} />
                {/* your boundary (blue) */}
                <rect x={120} y={50} width={150} height={110} rx={6} fill={BLUE} fillOpacity={0.12} stroke={BLUE} strokeWidth={2.5} />
                {/* the overlap (red) */}
                <rect x={120} y={70} width={60} height={90} fill={RED} fillOpacity={0.32} stroke={RED} strokeWidth={2} />

                <text x={70} y={200} fontSize={11} fontWeight={600} fill={AMBER}>Registered</text>
                <text x={228} y={44} fontSize={11} fontWeight={600} fill={BLUE} textAnchor="middle">Your land</text>
              </svg>

              <div className="mt-3 flex items-center justify-between rounded-xl bg-destructive/10 px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-semibold text-destructive">
                  <span className="size-2.5 rounded-sm" style={{ background: RED }} aria-hidden />
                  Overlap detected
                </span>
                <span className="text-xs font-medium text-destructive/80">clashes with 1 plot</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
