import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

const REGIONS = [
  { name: "Greater Accra", blurb: "Oyibi, East Legon Hills, Tema & Prampram", image: "/lands/land-01.jpg", featured: true },
  { name: "Ashanti", blurb: "Kumasi, Ejisu & Kuntanase", image: "/lands/land-02.jpg" },
  { name: "Eastern", blurb: "Aburi, Koforidua & Akosombo", image: "/lands/land-04.jpg" },
  { name: "Northern", blurb: "Tamale & Sagnarigu", image: "/lands/land-05.jpg" },
  { name: "Central", blurb: "Kasoa & Winneba", image: "/lands/land-03.jpg" },
  { name: "Upper West", blurb: "Wa and surroundings", image: "/lands/land-07.jpg" },
];

export function FeaturedRegions() {
  return (
    <section className="page-container py-16 sm:py-24">
      <SectionHeading
        kicker="Featured regions"
        title="Where do you want to own land?"
        subtitle="From the coast to the savannah — every region comes with the same verification and escrow protection."
      />
      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REGIONS.map((r) => (
          <Link
            key={r.name}
            href={`/listings?region=${encodeURIComponent(r.name)}`}
            className={
              "group relative overflow-hidden rounded-2xl border outline-none focus-visible:ring-3 focus-visible:ring-ring/60 " +
              (r.featured ? "sm:col-span-2 lg:col-span-1" : "")
            }
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={r.image}
                alt={`Land in the ${r.name} region`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/30 to-transparent" />
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5 text-secondary-foreground">
              <div>
                <h3 className="font-heading text-lg font-bold">{r.name}</h3>
                <p className="mt-0.5 text-xs text-secondary-foreground/80">{r.blurb}</p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform group-hover:rotate-45">
                <ArrowUpRight className="size-4" aria-hidden />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
