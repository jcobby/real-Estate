"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useSession, roleHome } from "@/stores/session";
import type { Role } from "@/types";

/**
 * Client-side route guard for the mock session.
 * No `roles` prop = any signed-in user.
 */
export function RequireRole({ roles, children }: { roles?: Role[]; children: React.ReactNode }) {
  const { session, hydrated } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const allowed = !!session && (!roles || roles.includes(session.user.role));

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!allowed) {
      toast.error("That area isn't available on your account", {
        description: `You're signed in as a ${session.user.role} and don't have access to this page.`,
      });
      router.replace(roleHome[session.user.role]);
    }
  }, [hydrated, session, allowed, pathname, router]);

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center" role="status" aria-label="Checking your session">
        <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden />
      </div>
    );
  }
  return <>{children}</>;
}
