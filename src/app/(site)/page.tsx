import type { Metadata } from "next";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandCheckPromo } from "@/components/landing/land-check-promo";
import { PopularListings } from "@/components/landing/popular-listings";
import { TrustSection } from "@/components/landing/trust-section";
import { FeaturedRegions } from "@/components/landing/featured-regions";
import { MaterialsPromo } from "@/components/landing/materials-promo";
import { Testimonials } from "@/components/landing/testimonials";
import { PartnersStrip } from "@/components/landing/partners-strip";
import { ClosingCta } from "@/components/landing/closing-cta";

export const metadata: Metadata = {
  title: "RealEstate — Buy verified land in Ghana, right on the map",
  description:
    "Browse satellite maps, pick the exact plots you want, verify titles and buy with escrow protection. Land you can trust across Greater Accra, Ashanti, Northern and beyond.",
};

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <LandCheckPromo />
      <PopularListings />
      <TrustSection />
      <FeaturedRegions />
      <MaterialsPromo />
      <Testimonials />
      <PartnersStrip />
      <ClosingCta />
    </main>
  );
}
