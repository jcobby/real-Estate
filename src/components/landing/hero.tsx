"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LAND_TYPES = [
  { value: "all", label: "Any land type" },
  { value: "developed", label: "Developed" },
  { value: "semi-developed", label: "Semi-developed" },
  { value: "greenfield", label: "Greenfield" },
  { value: "undeveloped", label: "Undeveloped" },
];

export function Hero() {
  const t = useTranslations("hero");
  const router = useRouter();
  const [q, setQ] = useState("");
  const [landStatus, setLandStatus] = useState("all");
  const [budget, setBudget] = useState("");

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (landStatus !== "all") params.set("landStatus", landStatus);
    if (budget) params.set("maxPrice", budget);
    router.push(`/listings${params.size ? `?${params}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden bg-secondary text-secondary-foreground">
      <div className="topo-bg absolute inset-0 opacity-60" aria-hidden />
      <div
        className="absolute -top-40 -right-40 size-[480px] rounded-full bg-primary/20 blur-[120px]"
        aria-hidden
      />
      <div className="page-container relative grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
          >
            <ShieldCheck className="size-3.5" aria-hidden />
            {t("kicker")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-5 font-heading text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-5 max-w-xl text-base leading-relaxed text-secondary-foreground/80 sm:text-lg"
          >
            {t("subtitle")}
          </motion.p>

          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onSubmit={search}
            aria-label="Search land"
            className="mt-8 grid gap-3 rounded-2xl bg-background p-3 text-foreground shadow-2xl sm:grid-cols-[1.4fr_1fr_1fr_auto]"
          >
            <div>
              <Label htmlFor="hero-q" className="sr-only">
                Location
              </Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="hero-q"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={t("searchLocation")}
                  className="h-11 pl-9"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="hero-type" className="sr-only">
                {t("searchType")}
              </Label>
              <Select items={LAND_TYPES} value={landStatus} onValueChange={(v) => setLandStatus(v as string)}>
                <SelectTrigger id="hero-type" className="h-11 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAND_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="hero-budget" className="sr-only">
                {t("searchBudget")}
              </Label>
              <Input
                id="hero-budget"
                type="number"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder={t("searchBudget")}
                className="h-11"
              />
            </div>
            <Button type="submit" size="lg" className="h-11 px-5">
              <Search data-icon="inline-start" />
              {t("searchCta")}
            </Button>
          </motion.form>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="mt-4"
          >
            <Link
              href="/land-check"
              className="group inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <ShieldCheck className="size-4" aria-hidden />
              Buying land? Run a free <span className="font-semibold">Land Check</span> for overlaps first
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-10 flex flex-wrap gap-x-10 gap-y-4"
          >
            {[
              { value: "180+", label: t("statPlots") },
              { value: "70%", label: t("statVerified") },
              { value: "8", label: t("statRegions") },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium tracking-wide text-secondary-foreground/70 uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>

        <HeroPlotPreview browseLabel={t("browseMap")} onBrowse={() => router.push("/map")} />
      </div>
    </section>
  );
}

/** Stylised plot-grid illustration: “click a plot on the satellite map”. */
function HeroPlotPreview({ browseLabel, onBrowse }: { browseLabel: string; onBrowse: () => void }) {
  const cells = [
    "a", "s", "a", "r", "a", "s",
    "s", "a", "sel", "a", "r", "a",
    "a", "r", "a", "a", "s", "a",
    "s", "a", "a", "sel", "a", "r",
  ] as const;
  const fill = { a: "fill-success/35", s: "fill-muted-foreground/25", r: "fill-warning/35", sel: "fill-primary" };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="relative mx-auto hidden w-full max-w-md lg:block"
    >
      <div className="rounded-3xl border border-secondary-foreground/15 bg-background/5 p-4 shadow-2xl backdrop-blur-sm">
        <svg viewBox="0 0 300 210" className="w-full rounded-2xl bg-secondary-foreground/5" role="img" aria-label="Illustration of selectable land plots on a map">
          <g stroke="currentColor" strokeOpacity={0.18}>
            {cells.map((c, i) => {
              const x = 12 + (i % 6) * 47;
              const y = 12 + Math.floor(i / 6) * 47;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width={43}
                  height={43}
                  rx={7}
                  className={fill[c]}
                />
              );
            })}
          </g>
          {/* native SMIL pulse — framer keyframes on SVG `r` throw when interrupted mid-navigation */}
          <circle cx={12 + 2 * 47 + 21.5} cy={12 + 1 * 47 + 21.5} r={9} className="fill-primary/30">
            <animate attributeName="r" values="9;17;9" dur="2.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0.15;0.7" dur="2.2s" repeatCount="indefinite" />
          </circle>
        </svg>

        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.4 }}
          className="absolute -top-4 right-6 flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-foreground shadow-lg"
        >
          <span className="size-2 rounded-full bg-success" aria-hidden />
          <span className="text-xs font-semibold">Plot OY-042 · Available</span>
        </motion.div>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 3.8, delay: 0.6 }}
          className="absolute -bottom-4 left-6 flex items-center gap-2 rounded-xl bg-background px-3 py-2 text-foreground shadow-lg"
        >
          <BadgeCheck className="size-4 text-success" aria-hidden />
          <span className="text-xs font-semibold">Escrow protected · Title verified</span>
        </motion.div>

        <div className="mt-4 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3 text-[11px] text-secondary-foreground/70">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-success/70" aria-hidden /> Available</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-warning/70" aria-hidden /> Reserved</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-primary" aria-hidden /> Selected</span>
          </div>
          <Button size="sm" variant="outline" className="border-primary/40 bg-transparent text-primary hover:bg-primary/10 hover:text-primary" onClick={onBrowse}>
            {browseLabel}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
