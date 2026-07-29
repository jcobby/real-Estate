import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your RealEstate account to manage favorites, messages, purchases and listings.",
};

export default function LoginPage() {
  return (
    <main>
      <AuthShell title="Welcome back" subtitle="Sign in to pick up where you left off.">
        <Suspense fallback={<Skeleton className="h-72 w-full rounded-2xl" />}>
          <LoginForm />
        </Suspense>
      </AuthShell>
    </main>
  );
}
