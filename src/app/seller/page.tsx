"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, Heart, Percent, Plus, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/shared/stat-tile";
import { TrendBarChart, TrendLineChart } from "@/components/charts/chart-kit";
import { getSellerLeads, getSellerStats } from "@/lib/api";
import { useSession } from "@/stores/session";
import { formatNumber, initials, timeAgo } from "@/lib/format";

export default function SellerOverviewPage() {
  const { session } = useSession();
  const user = session!.user;

  const { data: stats, isPending } = useQuery({
    queryKey: ["seller-stats", user.id],
    queryFn: () => getSellerStats(user.id),
  });
  const { data: leads = [] } = useQuery({
    queryKey: ["seller-leads", user.id],
    queryFn: () => getSellerLeads(user.id),
  });

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Seller overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user.company ?? user.name} · {stats ? `${stats.activeListings} active listings` : "…"}
          </p>
        </div>
        <Button render={<Link href="/seller/listings/new" />}>
          <Plus data-icon="inline-start" /> New listing
        </Button>
      </header>

      {isPending || !stats ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile label="Total views" value={formatNumber(stats.totalViews)} icon={Eye} trend={{ value: "+12%", positive: true }} hint="vs last month" />
          <StatTile label="Saves" value={formatNumber(stats.totalSaves)} icon={Heart} trend={{ value: "+8%", positive: true }} hint="buyers watching" />
          <StatTile label="Leads" value={formatNumber(stats.totalLeads)} icon={Users} trend={{ value: "+5", positive: true }} hint="this month" />
          <StatTile label="Conversion" value={`${stats.conversion}%`} icon={Percent} hint="views → leads" />
        </div>
      )}

      {/* views and leads live on different magnitudes — small multiples, never dual axes */}
      <div className="grid gap-5 lg:grid-cols-2">
        {stats ? (
          <>
            <TrendLineChart
              title="Listing views — last 8 weeks"
              data={stats.weeklyViews}
              xKey="week"
              series={[{ key: "views", name: "Views", color: "var(--chart-2)" }]}
            />
            <TrendBarChart
              title="Leads — last 8 weeks"
              data={stats.weeklyViews}
              xKey="week"
              series={[{ key: "leads", name: "Leads", color: "var(--chart-1)" }]}
            />
          </>
        ) : (
          <>
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </>
        )}
      </div>

      <section aria-label="Recent leads">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold">Fresh leads</h2>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary" render={<Link href="/seller/leads" />}>
            All leads <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        <Card className="divide-y rounded-2xl p-0">
          {leads.slice(0, 4).map((lead) => (
            <div key={lead.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar className="size-10">
                <AvatarImage src={lead.buyerAvatarUrl} alt="" />
                <AvatarFallback>{initials(lead.buyerName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{lead.buyerName}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {lead.note ?? lead.kind.replace("-", " ")} · {lead.listingTitle}
                </p>
              </div>
              <Badge variant={lead.status === "new" ? "default" : "outline"} className="capitalize">
                {lead.status}
              </Badge>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">{timeAgo(lead.createdAt)}</span>
            </div>
          ))}
          {leads.length === 0 && (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No leads yet — publish a listing to get started.</p>
          )}
        </Card>
      </section>
    </div>
  );
}
