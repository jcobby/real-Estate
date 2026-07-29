"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, MapPin, Package, ShoppingBag, StepForward, Truck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { advanceMaterialOrder, getMaterialOrders } from "@/lib/api";
import { useSession } from "@/stores/session";
import { formatDate, formatGHS } from "@/lib/format";
import type { MaterialOrderStatus } from "@/types";
import { cn } from "@/lib/utils";

const STEPS: { key: MaterialOrderStatus; label: string }[] = [
  { key: "processing", label: "Processing" },
  { key: "confirmed", label: "Confirmed" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
];

const STATUS_STYLE: Record<MaterialOrderStatus, string> = {
  processing: "bg-warning text-warning-foreground",
  confirmed: "bg-chart-3/20 text-foreground",
  dispatched: "bg-primary/20 text-accent-foreground dark:text-primary",
  delivered: "bg-success text-success-foreground",
};

export default function MaterialOrdersPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();

  const { data: orders, isPending } = useQuery({
    queryKey: ["material-orders", user.id],
    queryFn: () => getMaterialOrders(user.id),
  });

  const advance = useMutation({
    mutationFn: (id: string) => advanceMaterialOrder(id),
    onSuccess: (o) => {
      queryClient.invalidateQueries({ queryKey: ["material-orders", user.id] });
      toast.success(o?.status === "delivered" ? "Order delivered 🎉" : "Order moved to the next stage");
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Material orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track your building-material deliveries.</p>
        </div>
        <Button variant="outline" render={<Link href="/materials" />}>
          <ShoppingBag data-icon="inline-start" /> Shop materials
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {isPending ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
        ) : !orders || orders.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Order cement, blocks, roofing and tools — delivered to your site."
            action={
              <Button render={<Link href="/materials" />}>
                <ShoppingBag data-icon="inline-start" /> Browse materials
              </Button>
            }
          />
        ) : (
          orders.map((o) => {
            const stepIdx = STEPS.findIndex((s) => s.key === o.status);
            return (
              <Card key={o.id} className="gap-5 rounded-2xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">{o.orderNo}</span>
                      <Badge className={STATUS_STYLE[o.status]}>{o.status}</Badge>
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" aria-hidden /> {o.deliveryAddress}, {o.region} · ordered {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <p className="font-heading text-xl font-bold">{formatGHS(o.total)}</p>
                </div>

                {/* status stepper */}
                <ol className="flex items-center" aria-label="Delivery progress">
                  {STEPS.map((s, i) => (
                    <li key={s.key} className={cn("flex items-center", i < STEPS.length - 1 && "flex-1")}>
                      <span className="flex flex-col items-center gap-1 text-center">
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-full text-[10px] font-bold",
                            i <= stepIdx ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
                          )}
                        >
                          {i <= stepIdx ? <Check className="size-3.5" /> : i + 1}
                        </span>
                        <span className={cn("text-[11px]", i <= stepIdx ? "font-medium" : "text-muted-foreground")}>{s.label}</span>
                      </span>
                      {i < STEPS.length - 1 && <span className={cn("mx-1 mb-5 h-0.5 flex-1", i < stepIdx ? "bg-success" : "bg-border")} aria-hidden />}
                    </li>
                  ))}
                </ol>

                <ul className="divide-y rounded-xl border">
                  {o.lines.map((l) => (
                    <li key={l.materialId} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium">{l.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {l.qty} × {formatGHS(l.price)} / {l.unit}
                        </span>
                      </span>
                      <span className="font-semibold">{formatGHS(l.price * l.qty)}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-3 border-t pt-4 text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Truck className="size-4" aria-hidden />
                    {o.status === "delivered" ? "Delivered" : `ETA ${formatDate(o.eta)}`}
                  </span>
                  {o.status !== "delivered" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      disabled={advance.isPending}
                      onClick={() => advance.mutate(o.id)}
                    >
                      <StepForward data-icon="inline-start" /> Advance order
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
