"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Eye, FileDown, Map, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/shared/empty-state";
import { EscrowTimeline } from "@/components/purchases/escrow-timeline";
import { getPurchases, toggleMonitor } from "@/lib/api";
import { downloadMockDocument } from "@/lib/download";
import { useSession } from "@/stores/session";
import { formatAcres, formatDate, formatGHS, formatSqft } from "@/lib/format";
import type { PurchaseStatus } from "@/types";

const STATUS_STYLE: Record<PurchaseStatus, string> = {
  processing: "bg-warning text-warning-foreground",
  "in-escrow": "bg-chart-3/20 text-foreground",
  completed: "bg-success text-success-foreground",
  failed: "bg-destructive/15 text-destructive",
};

export default function PurchasesPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();

  const { data: purchases, isPending } = useQuery({
    queryKey: ["purchases", user.id],
    queryFn: () => getPurchases(user.id),
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Purchases &amp; owned plots</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Track escrow, download documents and monitor your land.
      </p>

      <div className="mt-6 space-y-5">
        {isPending ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
        ) : !purchases || purchases.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No purchases yet"
            description="Pick plots on the satellite map and buy them with escrow protection."
            action={
              <Button render={<Link href="/map" />}>
                <Map data-icon="inline-start" /> Browse the map
              </Button>
            }
          />
        ) : (
          purchases.map((p) => (
            <Card key={p.id} className="gap-5 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold">{p.receiptNo}</span>
                    <Badge className={STATUS_STYLE[p.status]}>
                      {p.status === "in-escrow" ? "In escrow" : p.status}
                    </Badge>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(p.createdAt)} · {p.plots.length} plot{p.plots.length > 1 ? "s" : ""} ·{" "}
                    {formatSqft(p.totalAreaSqm)} ({formatAcres(p.totalAreaSqm)})
                  </p>
                </div>
                <p className="font-heading text-xl font-bold">{formatGHS(p.amount + p.fees)}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {p.plots.map((plot) => (
                  <span key={plot.parcelId} className="rounded-lg border bg-muted/50 px-2.5 py-1.5 text-xs">
                    <span className="font-mono font-bold">{plot.plotNumber}</span>
                    <span className="text-muted-foreground"> · {plot.estateName}</span>
                  </span>
                ))}
              </div>

              <EscrowTimeline steps={p.escrow} compact />

              <div className="flex flex-wrap items-center gap-3 border-t pt-4">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Switch
                    checked={p.monitored}
                    onCheckedChange={async () => {
                      const on = await toggleMonitor(p.id);
                      queryClient.invalidateQueries({ queryKey: ["purchases", user.id] });
                      toast(on ? "Plot monitoring on" : "Plot monitoring off", {
                        description: on ? "We'll alert you about encroachment or status changes." : undefined,
                      });
                    }}
                    aria-label="Monitor these plots"
                  />
                  <Eye className="size-4 text-muted-foreground" aria-hidden /> Monitor
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    downloadMockDocument(`Receipt ${p.receiptNo}.pdf`, { Amount: formatGHS(p.amount + p.fees) });
                    toast.success("Receipt downloaded");
                  }}
                >
                  <FileDown data-icon="inline-start" /> Receipt
                </Button>
                <Button size="sm" className="ml-auto" render={<Link href={`/dashboard/purchase/${p.id}`} />}>
                  Escrow tracker <ArrowRight data-icon="inline-end" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
