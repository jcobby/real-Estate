"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Bell, Bookmark, Heart, Map, MessageSquareText, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatTile } from "@/components/shared/stat-tile";
import { EmptyState } from "@/components/shared/empty-state";
import { ListingCard, ListingCardSkeleton } from "@/components/listings/listing-card";
import { getListingsByIds, getNotifications, getPurchases, getUnreadCount } from "@/lib/api";
import { useFavorites } from "@/stores/favorites";
import { useSession } from "@/stores/session";
import { timeAgo } from "@/lib/format";

export default function BuyerOverviewPage() {
  const { session } = useSession();
  const user = session!.user;
  const favorites = useFavorites((s) => s.favorites);
  const savedSearches = useFavorites((s) => s.savedSearches);

  const { data: purchases = [] } = useQuery({
    queryKey: ["purchases", user.id],
    queryFn: () => getPurchases(user.id),
  });
  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-messages", user.id],
    queryFn: () => getUnreadCount(user.id),
  });
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user.id],
    queryFn: () => getNotifications(user.id),
  });
  const { data: favListings, isPending: favPending } = useQuery({
    queryKey: ["fav-preview", favorites.slice(0, 3)],
    queryFn: () => getListingsByIds(favorites.slice(0, 3)),
    enabled: favorites.length > 0,
  });

  const ownedPlots = purchases.reduce((s, p) => s + p.plots.length, 0);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Akwaaba, {user.name.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your land journey.</p>
        </div>
        <Button render={<Link href="/map" />}>
          <Map data-icon="inline-start" /> Browse the map
        </Button>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile label="Favorites" value={String(favorites.length)} icon={Heart} hint="saved listings" />
        <StatTile label="Saved searches" value={String(savedSearches.length)} icon={Bookmark} hint="with alerts" />
        <StatTile label="Unread messages" value={String(unread)} icon={MessageSquareText} hint="from sellers" />
        <StatTile label="Owned plots" value={String(ownedPlots)} icon={Wallet} hint="across purchases" />
      </div>

      <section aria-label="Recent notifications">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Latest updates</h2>
        </div>
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="No updates yet" description="Alerts about messages, escrow and verification will appear here." className="py-10" />
        ) : (
          <Card className="divide-y rounded-2xl p-0">
            {notifications.slice(0, 4).map((n) => (
              <Link
                key={n.id}
                href={n.href ?? "/dashboard"}
                className="flex items-center gap-3 px-5 py-3.5 transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-muted"
              >
                <span className={`size-2 shrink-0 rounded-full ${n.read ? "bg-border" : "bg-primary"}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <section aria-label="Favorite listings">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">From your favorites</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" render={<Link href="/dashboard/favorites" />}>
            View all <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        {favorites.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No favorites yet"
            description="Tap the heart on any listing to keep it here."
            action={<Button variant="outline" render={<Link href="/listings" />}>Browse listings</Button>}
            className="py-10"
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {favPending
              ? Array.from({ length: Math.min(3, favorites.length) }).map((_, i) => <ListingCardSkeleton key={i} />)
              : favListings?.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </div>
  );
}
