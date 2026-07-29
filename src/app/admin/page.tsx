"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, CircleDollarSign, Flag, LayoutList, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatTile } from "@/components/shared/stat-tile";
import { CategoryBars, TrendBarChart, TrendLineChart } from "@/components/charts/chart-kit";
import { getPlatformStats } from "@/lib/api";
import { formatGHS, formatNumber } from "@/lib/format";

export default function AdminAnalyticsPage() {
  const { data: stats, isPending } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: getPlatformStats,
  });

  if (isPending || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Platform analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">RealEstate marketplace health at a glance.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" render={<Link href="/admin/verification" />}>
            <ShieldCheck data-icon="inline-start" /> Queue ({stats.pendingVerifications})
          </Button>
          <Button variant="outline" render={<Link href="/admin/reports" />}>
            <Flag data-icon="inline-start" /> Reports ({stats.openReports})
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatTile label="Active listings" value={formatNumber(stats.activeListings)} icon={LayoutList} hint={`${stats.totalListings} total`} />
        <StatTile label="Users" value={formatNumber(stats.totalUsers)} icon={Users} trend={{ value: "+22%", positive: true }} hint="vs last month" />
        <StatTile label="GMV (all time)" value={formatGHS(stats.gmv, { compact: true })} icon={CircleDollarSign} hint="escrowed volume" />
        <StatTile label="Verified share" value={`${stats.verifiedShare}%`} icon={BadgeCheck} hint="of active listings" />
        <StatTile label="Verification queue" value={String(stats.pendingVerifications)} icon={ShieldCheck} hint="awaiting review" />
        <StatTile label="Open reports" value={String(stats.openReports)} icon={Flag} hint="need attention" />
      </div>

      {/* GMV (₵ hundreds of thousands) and counts live on different scales — small multiples */}
      <div className="grid gap-5 lg:grid-cols-2">
        <TrendLineChart
          title="GMV per month (₵)"
          data={stats.monthlySeries}
          xKey="month"
          series={[{ key: "gmv", name: "GMV", color: "var(--chart-1)" }]}
          formatter={(v) => formatGHS(v, { compact: true })}
        />
        <TrendBarChart
          title="New listings & signups per month"
          data={stats.monthlySeries}
          xKey="month"
          series={[
            { key: "listings", name: "Listings", color: "var(--chart-2)" },
            { key: "users", name: "New users", color: "var(--chart-3)" },
          ]}
        />
      </div>

      <CategoryBars
        title="Active listings by region"
        items={stats.regionBreakdown.map((r) => ({ label: r.region, value: r.count }))}
        className="max-w-2xl"
      />
    </div>
  );
}
