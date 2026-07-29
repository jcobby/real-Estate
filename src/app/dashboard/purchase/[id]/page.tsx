"use client";

import Link from "next/link";
import { use } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, FileDown, PackageX, ShieldCheck, StepForward } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { EscrowTimeline } from "@/components/purchases/escrow-timeline";
import { advanceEscrow, getPurchase } from "@/lib/api";
import { downloadMockDocument } from "@/lib/download";
import { formatDateTime, formatGHS, formatSqft, formatSqm } from "@/lib/format";

const METHOD_LABEL = { "mtn-momo": "MTN MoMo", "vodafone-cash": "Telecel/Vodafone Cash", card: "Card" };

export default function PurchaseTrackerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const { data: purchase, isPending } = useQuery({
    queryKey: ["purchase", id],
    queryFn: () => getPurchase(id),
  });

  const advance = useMutation({
    mutationFn: () => advanceEscrow(id),
    onSuccess: (p) => {
      queryClient.invalidateQueries({ queryKey: ["purchase", id] });
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        p?.status === "completed" ? "Escrow complete — the land is officially yours! 🎉" : "Escrow moved to the next stage",
      );
    },
  });

  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!purchase) {
    return (
      <EmptyState
        icon={PackageX}
        title="Purchase not found"
        description="It may belong to a different account."
        action={<Button render={<Link href="/dashboard/purchases" />}>Back to purchases</Button>}
      />
    );
  }

  const inEscrow = purchase.status === "in-escrow" || purchase.status === "processing";

  return (
    <div>
      <Button variant="ghost" size="sm" className="-ml-2 mb-4" render={<Link href="/dashboard/purchases" />}>
        <ArrowLeft data-icon="inline-start" /> All purchases
      </Button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            Escrow tracker <span className="font-mono text-lg text-muted-foreground">{purchase.receiptNo}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paid via {METHOD_LABEL[purchase.paymentMethod]} · {formatDateTime(purchase.createdAt)}
          </p>
        </div>
        <Badge
          className={
            purchase.status === "completed"
              ? "bg-success text-success-foreground"
              : "bg-chart-3/20 text-foreground"
          }
        >
          {purchase.status === "in-escrow" ? "In escrow" : purchase.status}
        </Badge>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card className="gap-5 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-base font-semibold">
                <ShieldCheck className="size-4.5 text-primary" aria-hidden /> Escrow progress
              </h2>
              {inEscrow && (
                <Button size="sm" variant="outline" onClick={() => advance.mutate()} disabled={advance.isPending}>
                  <StepForward data-icon="inline-start" />
                  {advance.isPending ? "Advancing…" : "Advance escrow"}
                </Button>
              )}
            </div>
            <EscrowTimeline steps={purchase.escrow} />
            <p className="rounded-lg bg-accent px-3 py-2 text-xs text-accent-foreground">
              Funds stay locked until every step completes — these transitions are handled by our documents team and the
              Lands Commission.
            </p>
          </Card>

          <Card className="gap-4 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Plots in this purchase</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plot</TableHead>
                    <TableHead>Estate</TableHead>
                    <TableHead className="text-right">Area</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchase.plots.map((p) => (
                    <TableRow key={p.parcelId}>
                      <TableCell className="font-mono font-bold">{p.plotNumber}</TableCell>
                      <TableCell>{p.estateName}</TableCell>
                      <TableCell className="text-right">
                        {formatSqm(p.areaSqm)}
                        <span className="block text-xs text-muted-foreground">{formatSqft(p.areaSqm)}</span>
                      </TableCell>
                      <TableCell className="text-right font-semibold">{formatGHS(p.price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="gap-3 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Payment summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Land price</dt>
                <dd className="font-medium">{formatGHS(purchase.amount)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Escrow &amp; documentation fee</dt>
                <dd className="font-medium">{formatGHS(purchase.fees)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2 font-heading text-base font-bold">
                <dt>Total paid</dt>
                <dd>{formatGHS(purchase.amount + purchase.fees)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="gap-3 rounded-2xl p-6">
            <h2 className="font-heading text-base font-semibold">Documents</h2>
            <p className="text-xs text-muted-foreground">
              {purchase.status === "completed"
                ? "All ownership documents are ready."
                : "Documents unlock as escrow steps complete."}
            </p>
            <ul className="space-y-2">
              {purchase.documents.map((doc) => (
                <li key={doc.name} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Download ${doc.name}`}
                    onClick={() => {
                      downloadMockDocument(doc.name, { Receipt: purchase.receiptNo });
                      toast.success("Document downloaded");
                    }}
                  >
                    <FileDown />
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
