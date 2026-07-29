import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for buyers. Simple, transparent fees for sellers and service providers — no hidden charges.",
};

const PLANS = [
  {
    name: "Buyer",
    price: "Free",
    period: "forever",
    blurb: "Everything you need to find and buy land safely.",
    features: [
      "Browse & search all listings",
      "Satellite map plot selection",
      "Escrow-protected payments (2% fee at checkout)",
      "Verification reports on listings",
      "Plot monitoring after purchase",
      "In-app messaging",
    ],
    cta: { label: "Start browsing", href: "/listings" },
    featured: false,
  },
  {
    name: "Seller / Agent",
    price: "₵199",
    period: "per listing / month",
    blurb: "List, verify and sell with the trust badge that converts.",
    features: [
      "Guided listing wizard with map tools",
      "Document verification & Verified badge",
      "Leads inbox & buyer messaging",
      "Analytics: views, saves, conversion",
      "Escrow settlement to MoMo or bank",
      "First listing free for 30 days",
    ],
    cta: { label: "Become a seller", href: "/register/seller" },
    featured: true,
  },
  {
    name: "Service Provider",
    price: "₵99",
    period: "per month",
    blurb: "Get discovered by land owners who need your skills.",
    features: [
      "Directory profile with reviews",
      "Unlimited quote requests",
      "Verified provider badge (after vetting)",
      "Priority ranking in your region",
      "Cancel anytime",
    ],
    cta: { label: "Join the directory", href: "/register/provider" },
    featured: false,
  },
];

export default function PricingPage() {
  return (
    <main className="page-container py-14">
      <SectionHeading
        kicker="Pricing"
        title="Transparent pricing, zero surprises"
        subtitle="Buyers never pay to browse. Sellers and providers pay simple flat fees — the escrow fee is the only per-transaction charge."
        align="center"
      />
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-card p-7",
              plan.featured && "border-primary shadow-xl lg:-my-3 lg:py-10",
            )}
          >
            {plan.featured && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                Most popular
              </span>
            )}
            <h2 className="font-heading text-lg font-bold">{plan.name}</h2>
            <p className="mt-3">
              <span className="font-heading text-4xl font-bold">{plan.price}</span>
              <span className="ml-1.5 text-sm text-muted-foreground">{plan.period}</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{plan.blurb}</p>
            <ul className="mt-6 flex-1 space-y-2.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              className="mt-7 h-11 w-full"
              variant={plan.featured ? "default" : "outline"}
              size="lg"
              render={<Link href={plan.cta.href} />}
            >
              {plan.cta.label}
            </Button>
          </div>
        ))}
      </div>
      <p className="mt-10 text-center text-xs text-muted-foreground">
        All prices in Ghana Cedis.
      </p>
    </main>
  );
}
