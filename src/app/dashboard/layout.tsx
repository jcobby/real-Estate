import type { Metadata } from "next";
import { BuyerShell } from "@/components/layout/area-shells";

export const metadata: Metadata = {
  title: "Buyer dashboard",
  description: "Your favorites, saved searches, messages and land purchases in one place.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <BuyerShell>{children}</BuyerShell>;
}
