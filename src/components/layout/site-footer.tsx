import Link from "next/link";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/shared/logo";
import { NewsletterForm } from "./newsletter-form";
import { ShieldCheck, Landmark, Eye } from "lucide-react";

const COLUMNS = [
  {
    key: "marketplace",
    links: [
      { label: "Browse listings", href: "/listings" },
      { label: "Map browse", href: "/map" },
      { label: "Building materials", href: "/materials" },
      { label: "Service providers", href: "/service-providers" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    key: "company",
    links: [
      { label: "About us", href: "/about" },
      { label: "How verification works", href: "/faq" },
      { label: "Become a seller", href: "/register/seller" },
      { label: "Join as a provider", href: "/register/provider" },
    ],
  },
  {
    key: "support",
    links: [
      { label: "FAQ & help", href: "/faq" },
      { label: "Report a scam", href: "/faq" },
      { label: "Contact us", href: "/about" },
      { label: "Escrow guide", href: "/faq" },
    ],
  },
] as const;

export function SiteFooter() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 border-t bg-sidebar">
      <div className="page-container py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{t("blurb")}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                { icon: ShieldCheck, label: "Escrow protected" },
                { icon: Landmark, label: "Verified titles" },
                { icon: Eye, label: "Plot monitoring" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <Icon className="size-3.5 text-primary" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.key} aria-label={t(col.key)}>
              <h3 className="text-sm font-semibold">{t(col.key)}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border bg-background p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h3 className="font-heading text-base font-semibold">Get new-land alerts</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh verified plots in your region, straight to your inbox.
            </p>
          </div>
          <NewsletterForm />
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} RealEstate. {t("rights")}
          </p>
        </div>
      </div>
    </footer>
  );
}
