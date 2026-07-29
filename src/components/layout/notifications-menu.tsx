"use client";

import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, CircleDollarSign, FileCheck2, MessageSquareText, ShieldAlert, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";
import type { AppNotification, NotificationType } from "@/types";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationType, typeof Bell> = {
  message: MessageSquareText,
  "price-drop": Tag,
  verification: FileCheck2,
  escrow: CircleDollarSign,
  listing: Tag,
  system: ShieldAlert,
};

export function NotificationsMenu({ userId }: { userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: () => getNotifications(userId),
    refetchInterval: 20_000,
  });
  const unread = notifications.filter((n) => !n.read).length;

  const markAll = useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const open = async (n: AppNotification) => {
    await markNotificationRead(n.id);
    queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
    if (n.href) router.push(n.href);
  };

  return (
    <Popover>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label="Notifications" />}
      >
        <Bell />
        {unread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 rounded-full px-1 text-[10px]">{unread}</Badge>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={unread === 0 || markAll.isPending}
          >
            <CheckCheck data-icon="inline-start" />
            Mark all read
          </Button>
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">
              You&apos;re all caught up — no notifications yet.
            </p>
          ) : (
            <ul className="divide-y">
              {notifications.slice(0, 12).map((n) => {
                const Icon = ICONS[n.type];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => open(n)}
                      className={cn(
                        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                        !n.read && "bg-accent/40",
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full",
                          n.read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className={cn("block truncate text-sm", !n.read && "font-semibold")}>{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                        <span className="mt-1 block text-[11px] text-muted-foreground/70">{timeAgo(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
