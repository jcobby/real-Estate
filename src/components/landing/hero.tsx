"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Search, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** MapLibre only loads once the hero mounts, and never on the server. */
const HeroMap = dynamic(() => import("./hero-map").then((m) => m.HeroMap), {
  ssr: false,
  loading: () => (
    <div className="mx-auto hidden w-full max-w-md lg:block">
      <Skeleton className="h-[380px] w-full rounded-3xl" />
    </div>
  ),
});

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
            className="mt-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center"
          >
            <Button size="lg" className="group h-12 px-6 text-base" render={<Link href="/land-check" />}>
              <ShieldCheck data-icon="inline-start" className="size-4.5" />
              Check your land for conflicts
              <ArrowRight data-icon="inline-end" className="transition-transform group-hover:translate-x-0.5" />
            </Button>
            <span className="text-xs text-secondary-foreground/70 sm:text-sm">
              Buying land? Spot double-sales before you pay — free for members.
            </span>
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

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <HeroMap browseLabel={t("browseMap")} onBrowse={() => router.push("/map")} />
        </motion.div>
      </div>
    </section>
  );
}
