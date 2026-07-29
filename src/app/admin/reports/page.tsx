"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Flag } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/empty-state";
import { getReports, updateReportStatus } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import type { AbuseReport } from "@/types";

const STATUS_ITEMS = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const STATUS_STYLE: Record<AbuseReport["status"], string> = {
  open: "bg-destructive/15 text-destructive",
  investigating: "bg-warning text-warning-foreground",
  resolved: "bg-success text-success-foreground",
  dismissed: "bg-muted text-muted-foreground",
};

export default function AdminReportsPage() {
  const queryClient = useQueryClient();
  const { data: reports, isPending } = useQuery({ queryKey: ["reports"], queryFn: getReports });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AbuseReport["status"] }) => updateReportStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report updated");
    },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Reports &amp; abuse</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Scam protection in action — every flag gets investigated.
      </p>

      <div className="mt-6 space-y-4">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : !reports || reports.length === 0 ? (
          <EmptyState icon={Flag} title="No reports" description="The marketplace is clean right now." />
        ) : (
          reports.map((r) => (
            <Card key={r.id} className="gap-3 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_STYLE[r.status]}>{r.status}</Badge>
                  <Badge variant="outline" className="capitalize">
                    {r.targetType}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                </div>
                <Select
                  items={STATUS_ITEMS}
                  value={r.status}
                  onValueChange={(v) => setStatus.mutate({ id: r.id, status: v as AbuseReport["status"] })}
                >
                  <SelectTrigger size="sm" className="w-40" aria-label={`Status for report ${r.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ITEMS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {r.reason} —{" "}
                  {r.targetType === "listing" ? (
                    <Link href={`/property/${r.targetId}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      {r.targetLabel} <ExternalLink className="size-3" aria-hidden />
                    </Link>
                  ) : (
                    <span>{r.targetLabel}</span>
                  )}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                <p className="mt-2 text-xs text-muted-foreground">Reported by {r.reporterName}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
