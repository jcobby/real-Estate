import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/shared/section-heading";

export const metadata: Metadata = {
  title: "About us",
  description:
    "RealEstate exists to end land fraud in Ghana — verified titles, escrow payments and satellite-level transparency for every buyer.",
};

const STATS = [
  { value: "₵1.4M+", label: "Escrowed safely" },
  { value: "184", label: "Mapped plots" },
  { value: "8", label: "Regions covered" },
  { value: "0", label: "Successful scams" },
];

const TEAM = [
  { name: "Adjoa Mensah", role: "Trust & Safety Lead", img: 24 },
  { name: "Selorm Agbeko", role: "Head of Partnerships", img: 32 },
  { name: "Kwesi Botchway", role: "Chief Surveyor", img: 8 },
  { name: "Efua Baidoo", role: "Community & Support", img: 44 },
];

export default function AboutPage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-secondary py-20 text-secondary-foreground">
        <div className="topo-bg absolute inset-0 opacity-40" aria-hidden />
        <div className="page-container relative max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Our mission</p>
          <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            Nobody should lose their life savings to a land scam
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-secondary-foreground/75 sm:text-base">
            Land disputes clog Ghana&apos;s courts, and double sales devastate families at home and in the diaspora.
            We built RealEstate to fix that: satellite-level transparency, document verification against official
            records, and escrow that makes fraud unprofitable.
          </p>
        </div>
      </section>

      <section className="page-container -mt-10 pb-4">
        <div className="relative grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border shadow-lg lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-card p-6 text-center">
              <p className="font-heading text-2xl font-bold text-primary sm:text-3xl">{s.value}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="page-container py-16">
        <SectionHeading
          kicker="How we got here"
          title="From one bad experience to a safer marketplace"
        />
        <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          <p>
            RealEstate started in 2023 after our founder&apos;s family bought the same Aburi plot twice — from two
            different &ldquo;owners&rdquo;. The documents looked real. The agent seemed genuine. The land wasn&apos;t
            theirs to sell.
          </p>
          <p>
            We decided the fix wasn&apos;t more paperwork — it was <em>verifiable</em> paperwork. Today every Verified
            listing has been checked against Lands Commission records, every payment sits in escrow until title
            transfer, and every buyer can see the exact plot they&apos;re buying from the sky before a single cedi
            moves.
          </p>
        </div>
      </section>

      <section className="border-y bg-sidebar py-16">
        <div className="page-container">
          <SectionHeading kicker="The team" title="People behind the platform" align="center" />
          <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-6 sm:grid-cols-4">
            {TEAM.map((member) => (
              <div key={member.name} className="text-center">
                <Image
                  src={`https://i.pravatar.cc/150?img=${member.img}`}
                  alt={`Portrait of ${member.name}`}
                  width={96}
                  height={96}
                  className="mx-auto size-24 rounded-2xl object-cover"
                />
                <p className="mt-3 text-sm font-semibold">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="page-container py-16" id="contact">
        <div className="grid gap-10 lg:grid-cols-2">
          <SectionHeading
            kicker="Contact"
            title="Talk to a human"
            subtitle="Questions about a listing, verification or selling? We answer within one business hour, Monday to Saturday."
          />
          <div className="space-y-3">
            {[
              { icon: Phone, label: "+233 30 255 0000", href: "tel:+233302550000" },
              { icon: Mail, label: "advisors@realestate.app", href: "mailto:advisors@realestate.app" },
              { icon: MapPin, label: "12 Independence Ave, Accra", href: undefined },
            ].map(({ icon: Icon, label, href }) => (
              <div key={label} className="flex items-center gap-3 rounded-2xl border bg-card px-5 py-4">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <Icon className="size-4.5" aria-hidden />
                </span>
                {href ? (
                  <a href={href} className="text-sm font-semibold hover:underline">
                    {label}
                  </a>
                ) : (
                  <span className="text-sm font-semibold">{label}</span>
                )}
              </div>
            ))}
            <Button size="lg" className="mt-2 h-11 w-full" render={<Link href="/register" />}>
              Create a free account
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
