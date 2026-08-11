import type { Metadata } from "next";
import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "FAQ & help",
  description: "How verification, escrow, plot selection and payments work on RealEstate.",
};

const FAQS = [
  {
    q: "How does land verification work?",
    a: "Sellers upload their registered indenture, an approved site plan, a licensed surveyor's report and a national ID. Our documents team cross-checks them against Lands Commission records, confirms there's no pending litigation, and verifies the seller's identity. Only then does a listing earn the Verified badge — and you can see exactly which checks passed on every listing page.",
  },
  {
    q: "What is escrow and why does it matter?",
    a: "When you buy, your money goes into a RealEstate escrow account — not to the seller. It's only released after three confirmations: the indenture and site plan are executed in your name, the title transfer is registered, and you confirm handover. If anything fails verification, you get a full refund. This is how we stop the double-sale scams common in land transactions.",
  },
  {
    q: "How do I buy an exact plot on the map?",
    a: "Open the Map page, zoom into any estate, and tap the green (available) plots you want — each shows its plot number, size, owner and price. Your selection panel totals the land area and price. Hit Buy, choose MTN MoMo, Telecel Cash or card, and the escrow tracker takes over from there.",
  },
  {
    q: "Which payment methods are supported?",
    a: "MTN Mobile Money, Telecel (Vodafone) Cash, and debit/credit cards via a secure payment gateway. Your payment is held in escrow until the land's documents and title transfer to you.",
  },
  {
    q: "What does 'monitor this plot' do?",
    a: "Monitoring watches your plot for status changes and encroachment reports from our field partners and community. You'll get an alert if anything changes — especially useful for diaspora buyers who can't visit regularly.",
  },
  {
    q: "How do I report a suspicious listing?",
    a: "Use the report option on any listing, or contact support with the listing link. Our Trust & Safety team investigates every flag — listings can be frozen mid-investigation so nobody else can buy.",
  },
  {
    q: "What do the land statuses mean?",
    a: "Developed: roads, utilities and services are in place — build immediately. Semi-developed: access is graded and utilities have reached the boundary. Greenfield: a newly opened layout with approval in place. Undeveloped: raw land at the lowest entry price.",
  },
  {
    q: "Can I sell my own family land?",
    a: "Yes. Register as a seller, run the listing wizard (enter your plot's boundary coordinates or upload a GeoJSON/KML file from your surveyor), and submit your documents for verification. Individual owners and licensed agents are both welcome.",
  },
];

export default function FaqPage() {
  return (
    <main className="page-container max-w-3xl py-14">
      <SectionHeading
        kicker="Help centre"
        title="Frequently asked questions"
        subtitle="Everything about buying, verifying and selling land on RealEstate."
        align="center"
      />
      <Accordion className="mt-10">
        {FAQS.map((f) => (
          <AccordionItem key={f.q} value={f.q}>
            <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">{f.q}</AccordionTrigger>
            <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <div className="mt-12 rounded-2xl bg-secondary p-8 text-center text-secondary-foreground">
        <h2 className="font-heading text-xl font-bold">Still have questions?</h2>
        <p className="mt-2 text-sm text-secondary-foreground/75">
          Our land advisors reply within one business hour, Mon–Sat.
        </p>
        <Button className="mt-5" render={<Link href="/about" />}>
          Contact us
        </Button>
      </div>
    </main>
  );
}
