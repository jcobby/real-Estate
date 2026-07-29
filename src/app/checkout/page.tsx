import type { Metadata } from "next";
import { Suspense } from "react";
import { RequireRole } from "@/components/auth/require-role";
import { CheckoutFlow } from "@/components/checkout/checkout-flow";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Checkout — escrow-protected purchase",
  description: "Pay with MoMo or card into escrow, with your money protected until title transfers.",
};

export default function CheckoutPage() {
  return (
    <main className="page-container max-w-5xl py-8">
      <RequireRole>
        <Suspense fallback={<Skeleton className="h-96 w-full rounded-2xl" />}>
          <CheckoutFlow />
        </Suspense>
      </RequireRole>
    </main>
  );
}
