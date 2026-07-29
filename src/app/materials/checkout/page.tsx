import type { Metadata } from "next";
import { RequireRole } from "@/components/auth/require-role";
import { MaterialsCheckout } from "@/components/materials/materials-checkout";

export const metadata: Metadata = {
  title: "Materials checkout",
  description: "Pay for your building materials with MoMo or card and get them delivered to your site.",
};

export default function MaterialsCheckoutPage() {
  return (
    <main className="page-container max-w-5xl py-8">
      <RequireRole>
        <MaterialsCheckout />
      </RequireRole>
    </main>
  );
}
