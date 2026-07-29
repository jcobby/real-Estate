import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { CATEGORY_META } from "@/components/materials/category-meta";
import { MATERIAL_CATEGORIES } from "@/data/materials";

/** Landing teaser for the building-materials shop. */
export function MaterialsPromo() {
  const featured = MATERIAL_CATEGORIES.slice(0, 8);
  return (
    <section className="page-container py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading
          kicker="Build on your land"
          title="Materials & tools, delivered to your site"
          subtitle="Bought the land? Order cement, blocks, roofing, steel, tiles and tools from trusted suppliers — pay with MoMo and get it delivered."
        />
        <Button className="hidden sm:inline-flex" render={<Link href="/materials" />}>
          <Truck data-icon="inline-start" /> Shop materials
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {featured.map((c) => {
          const meta = CATEGORY_META[c.value];
          const Icon = meta.icon;
          return (
            <Link
              key={c.value}
              href={`/materials?category=${c.value}`}
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span
                className="flex size-14 items-center justify-center rounded-2xl transition-transform group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${meta.from}, ${meta.to})` }}
              >
                <Icon className="size-6" style={{ color: meta.fg }} strokeWidth={1.6} aria-hidden />
              </span>
              <span className="text-sm font-semibold">{c.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-6 sm:hidden">
        <Button className="w-full" render={<Link href="/materials" />}>
          Shop materials <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </section>
  );
}
