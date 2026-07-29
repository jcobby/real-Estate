import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PackagePlus, Store, UserRound, Wrench } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Join RealEstate as a buyer, land seller, materials supplier or service provider.",
};

const ROLES = [
  {
    href: "/register/buyer",
    icon: UserRound,
    title: "I'm buying land",
    body: "Browse the map, verify titles, buy with escrow and monitor your plots.",
  },
  {
    href: "/register/seller",
    icon: Store,
    title: "I'm selling land",
    body: "List plots with maps and documents, get verified, and manage leads.",
  },
  {
    href: "/register/seller?next=/seller/materials",
    icon: PackagePlus,
    title: "I supply materials & tools",
    body: "List cement, blocks, roofing, tools and more — sell to builders across Ghana.",
  },
  {
    href: "/register/provider",
    icon: Wrench,
    title: "I offer services",
    body: "Surveyors, builders, electricians and more — get discovered by land owners.",
  },
] as const;

export default function RegisterPage() {
  return (
    <main>
      <AuthShell title="Create your account" subtitle="First, tell us what brings you to RealEstate.">
        <div className="flex flex-col gap-3">
          {ROLES.map(({ href, icon: Icon, title, body }) => (
            <Link
              key={title}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all outline-none hover:border-primary hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-base font-semibold">{title}</span>
                <span className="mt-0.5 block text-sm text-muted-foreground">{body}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
            </Link>
          ))}
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </AuthShell>
    </main>
  );
}
