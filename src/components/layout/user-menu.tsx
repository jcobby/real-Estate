"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LayoutDashboard, LogOut, MessageSquareText, Settings } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, roleHome } from "@/stores/session";
import { initials } from "@/lib/format";

export function UserMenu() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { session, signOut } = useSession();
  if (!session) return null;
  const { user } = session;
  const messagesHref = user.role === "seller" ? "/seller/messages" : "/dashboard/messages";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Avatar className="size-9 border-2 border-primary/50">
          <AvatarImage src={user.avatarUrl} alt="" />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Base UI: GroupLabel must live inside a Group */}
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-[11px] font-medium text-primary capitalize">{user.role} account</p>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={roleHome[user.role]} />}>
          <LayoutDashboard /> {t("dashboard")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={messagesHref} />}>
          <MessageSquareText /> {t("messages")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Settings /> {t("settings")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            signOut();
            router.push("/");
          }}
        >
          <LogOut /> {t("signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
