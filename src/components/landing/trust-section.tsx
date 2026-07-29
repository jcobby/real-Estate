import { useTranslations } from "next-intl";
import { BadgeCheck, Eye, Landmark, ShieldCheck, TrendingDown } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

export function TrustSection() {
  const t = useTranslations("trust");
  const features = [
    { icon: Landmark, title: t("verifiedTitles"), body: t("verifiedTitlesBody") },
    { icon: ShieldCheck, title: t("escrow"), body: t("escrowBody") },
    { icon: Eye, title: t("monitoring"), body: t("monitoringBody") },
    { icon: TrendingDown, title: t("rates"), body: t("ratesBody") },
    { icon: BadgeCheck, title: t("scam"), body: t("scamBody") },
  ];

  return (
    <section className="relative overflow-hidden bg-secondary py-16 text-secondary-foreground sm:py-24">
      <div className="topo-bg absolute inset-0 opacity-40" aria-hidden />
      <div className="page-container relative">
        <SectionHeading kicker={t("kicker")} title={t("title")} align="center" className="[&_h2]:text-secondary-foreground [&_p:last-child]:text-secondary-foreground/70" />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-secondary-foreground/10 bg-secondary-foreground/[0.04] p-6 backdrop-blur-sm transition-colors hover:border-primary/40"
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <f.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-heading text-base font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/70">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
