"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function DashboardShell({
  nav,
  ariaLabel,
  children,
}: {
  nav: DashNavItem[];
  ariaLabel: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (item: DashNavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <div className="page-container grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label={ariaLabel} className="lg:sticky lg:top-20 lg:self-start">
        <ul className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible">
          {nav.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive(item) ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  isActive(item)
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
