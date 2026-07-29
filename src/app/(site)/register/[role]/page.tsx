import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterWizard } from "@/components/auth/register-wizard";
import { Skeleton } from "@/components/ui/skeleton";

const VALID = ["buyer", "seller", "provider"] as const;
type ValidRole = (typeof VALID)[number];

const COPY: Record<ValidRole, { title: string; subtitle: string }> = {
  buyer: { title: "Buy land with confidence", subtitle: "A couple of steps and you can start selecting plots on the map." },
  seller: { title: "List land or materials", subtitle: "Set up your seller profile to list plots and/or building materials." },
  provider: { title: "Grow your service business", subtitle: "Join the directory that land owners actually search." },
};

interface Props {
  params: Promise<{ role: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { role } = await params;
  if (!VALID.includes(role as ValidRole)) return { title: "Register" };
  return { title: `Register as a ${role}` };
}

export default async function RegisterRolePage({ params }: Props) {
  const { role } = await params;
  if (!VALID.includes(role as ValidRole)) notFound();
  const copy = COPY[role as ValidRole];
  return (
    <main>
      <AuthShell title={copy.title} subtitle={copy.subtitle}>
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <RegisterWizard role={role as ValidRole} />
        </Suspense>
      </AuthShell>
    </main>
  );
}
