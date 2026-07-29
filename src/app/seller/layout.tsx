import type { Metadata } from "next";
import { SellerShell } from "@/components/layout/area-shells";

export const metadata: Metadata = {
  title: "Seller dashboard",
  description: "Manage listings, leads, messages and verification for your land portfolio.",
};

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
