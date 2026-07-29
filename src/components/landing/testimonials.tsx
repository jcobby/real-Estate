import Image from "next/image";
import { Quote } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";
import { StarRating } from "@/components/shared/star-rating";

const TESTIMONIALS = [
  {
    name: "Akua Owusu",
    role: "Bought 2 plots at Oyibi from London",
    avatar: "https://i.pravatar.cc/150?img=45",
    rating: 5,
    quote:
      "I picked my exact plots on the satellite map from my sofa in London. The escrow tracker showed every step until the title was in my name. This is how land should be bought.",
  },
  {
    name: "Yaw Darko",
    role: "First-time buyer, Kumasi",
    avatar: "https://i.pravatar.cc/150?img=60",
    rating: 5,
    quote:
      "After a bad experience elsewhere, the Verified badge and document checks gave me the confidence to buy. The surveyor's report was already on the listing.",
  },
  {
    name: "Mariama Alhassan",
    role: "Investor, Tamale",
    avatar: "https://i.pravatar.cc/150?img=31",
    rating: 4,
    quote:
      "I monitor my plots right in the app and get alerts if anything changes. Buying in Sagnarigu took a week, not months — and everything was documented.",
  },
];

export function Testimonials() {
  return (
    <section className="border-t bg-sidebar py-16 sm:py-24">
      <div className="page-container">
        <SectionHeading kicker="Buyer stories" title="Trusted by buyers at home and in the diaspora" align="center" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="flex flex-col rounded-2xl border bg-card p-7 shadow-sm">
              <Quote className="size-6 text-primary" aria-hidden />
              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t pt-5">
                <Image
                  src={t.avatar}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 rounded-full object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.role}</p>
                </div>
                <StarRating rating={t.rating} size="sm" className="ml-auto [&_span]:hidden" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
