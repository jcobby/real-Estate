import type { Metadata } from "next";
import { AdminShell } from "@/components/layout/area-shells";

export const metadata: Metadata = {
  title: "Admin console",
  description: "Platform analytics, verification queue, listing moderation, user management and abuse reports.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
