"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Menu, MessageSquareText } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "./theme-toggle";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";
import { CartButton } from "@/components/materials/cart-sheet";
import { useSession, roleHome } from "@/stores/session";
import { getUnreadCount } from "@/lib/api";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/listings", key: "explore" },
  { href: "/map", key: "map" },
  { href: "/land-check", key: "landCheck" },
  { href: "/materials", key: "materials" },
  { href: "/service-providers", key: "services" },
  { href: "/pricing", key: "pricing" },
  { href: "/faq", key: "faq" },
] as const;

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { session, hydrated } = useSession();
  const [open, setOpen] = useState(false);
  const user = session?.user;

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-messages", user?.id],
    queryFn: () => getUnreadCount(user!.id),
    enabled: !!user,
    refetchInterval: 20_000,
  });

  const messagesHref = user?.role === "seller" ? "/seller/messages" : "/dashboard/messages";

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="page-container flex h-16 items-center gap-3">
        <Logo />

        <nav aria-label="Main" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                pathname === item.href && "bg-accent text-accent-foreground",
              )}
            >
              {t(item.key)}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <CartButton />
          <ThemeToggle />
          {hydrated && user ? (
            <>
              <Button variant="ghost" size="icon" className="relative" render={<Link href={messagesHref} aria-label={t("messages")} />}>
                <MessageSquareText />
                {unread > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]">{unread}</Badge>
                )}
              </Button>
              <NotificationsMenu userId={user.id} />
              <UserMenu />
            </>
          ) : (
            <>
              <Button variant="ghost" className="hidden sm:inline-flex" render={<Link href="/login" />}>
                {t("signIn")}
              </Button>
              <Button className="hidden sm:inline-flex" render={<Link href="/register" />}>
                {t("getStarted")}
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu" />
              }
            >
              <Menu />
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex flex-col gap-1 px-4">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                      pathname === item.href && "bg-accent text-accent-foreground",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                ))}
                <Separator className="my-3" />
                {hydrated && user ? (
                  <Link
                    href={roleHome[user.role]}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {t("dashboard")}
                  </Link>
                ) : (
                  <div className="flex flex-col gap-2 px-1">
                    <Button variant="outline" render={<Link href="/login" onClick={() => setOpen(false)} />}>
                      {t("signIn")}
                    </Button>
                    <Button render={<Link href="/register" onClick={() => setOpen(false)} />}>
                      {t("getStarted")}
                    </Button>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
