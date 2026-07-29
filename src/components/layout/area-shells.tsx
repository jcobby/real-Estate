"use client";

import {
  BarChart3,
  FileCheck2,
  Flag,
  Heart,
  LayoutDashboard,
  LayoutList,
  MessageSquareText,
  Package,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell } from "./dashboard-shell";

/**
 * Role-area shells (client components so nav icons stay client-side).
 * Server layouts render these and keep their own metadata exports.
 */

export function BuyerShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole>
      <DashboardShell
        ariaLabel="Buyer dashboard"
        nav={[
          { label: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
          { label: "Favorites", href: "/dashboard/favorites", icon: Heart },
          { label: "Messages", href: "/dashboard/messages", icon: MessageSquareText },
          { label: "Purchases", href: "/dashboard/purchases", icon: Wallet },
          { label: "Material orders", href: "/dashboard/orders", icon: Package },
          { label: "Settings", href: "/settings", icon: Settings },
        ]}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}

export function SellerShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["seller"]}>
      <DashboardShell
        ariaLabel="Seller dashboard"
        nav={[
          { label: "Overview", href: "/seller", icon: BarChart3, exact: true },
          { label: "Land listings", href: "/seller/listings", icon: LayoutList },
          { label: "Materials", href: "/seller/materials", icon: Package },
          { label: "Land check", href: "/land-check", icon: ShieldAlert },
          { label: "Leads", href: "/seller/leads", icon: Users },
          { label: "Messages", href: "/seller/messages", icon: MessageSquareText },
          { label: "Verification", href: "/seller/verification", icon: FileCheck2 },
          { label: "Settings", href: "/settings", icon: Settings },
        ]}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole roles={["admin"]}>
      <DashboardShell
        ariaLabel="Admin console"
        nav={[
          { label: "Analytics", href: "/admin", icon: BarChart3, exact: true },
          { label: "Verification", href: "/admin/verification", icon: ShieldCheck },
          { label: "Listings", href: "/admin/listings", icon: LayoutList },
          { label: "Users", href: "/admin/users", icon: Users },
          { label: "Reports", href: "/admin/reports", icon: Flag },
        ]}
      >
        {children}
      </DashboardShell>
    </RequireRole>
  );
}
