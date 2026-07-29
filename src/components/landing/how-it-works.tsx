import { useTranslations } from "next-intl";
import { BadgeCheck, HandCoins, MousePointerClick } from "lucide-react";
import { SectionHeading } from "@/components/shared/section-heading";

export function HowItWorks() {
  const t = useTranslations("howItWorks");
  const steps = [
    { icon: MousePointerClick, title: t("search"), body: t("searchBody") },
    { icon: BadgeCheck, title: t("verify"), body: t("verifyBody") },
    { icon: HandCoins, title: t("buy"), body: t("buyBody") },
  ];

  return (
    <section className="page-container py-16 sm:py-24">
      <SectionHeading kicker={t("kicker")} title={t("title")} align="center" />
      <ol className="relative mt-12 grid gap-6 sm:grid-cols-3">
        <div
          className="absolute top-10 right-[16%] left-[16%] hidden border-t-2 border-dashed border-border sm:block"
          aria-hidden
        />
        {steps.map((step, i) => (
          <li key={step.title} className="relative flex flex-col items-center rounded-2xl border bg-card p-8 text-center shadow-sm">
            <span className="relative flex size-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <step.icon className="size-6" aria-hidden />
              <span className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-primary font-heading text-xs font-bold text-primary-foreground">
                {i + 1}
              </span>
            </span>
            <h3 className="mt-5 font-heading text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
