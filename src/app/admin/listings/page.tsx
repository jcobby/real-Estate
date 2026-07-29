"use client";

import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, Flag, LayoutList, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { VerificationBadge } from "@/components/shared/badges";
import { getModerationListings, moderateListing, type ModerationAction } from "@/lib/api";
import { formatGHS, timeAgo } from "@/lib/format";
import type { ListingLifecycle } from "@/types";

const STATUS_STYLE: Partial<Record<ListingLifecycle, string>> = {
  active: "bg-success text-success-foreground",
  paused: "bg-muted text-muted-foreground",
  "pending-review": "bg-warning text-warning-foreground",
  flagged: "bg-destructive/15 text-destructive",
};

export default function AdminListingsPage() {
  const queryClient = useQueryClient();
  const { data: listings, isPending } = useQuery({
    queryKey: ["moderation-listings"],
    queryFn: getModerationListings,
  });

  const act = useMutation({
    mutationFn: ({ id, action }: { id: string; action: ModerationAction }) => moderateListing(id, action),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["moderation-listings"] });
      toast.success(
        vars.action === "remove"
          ? "Listing removed from the marketplace"
          : vars.action === "flag"
            ? "Listing flagged"
            : "Listing approved and live",
      );
    },
  });

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Listing moderation</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Flagged and pending listings float to the top.
      </p>

      <div className="mt-6">
        {isPending ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !listings || listings.length === 0 ? (
          <EmptyState icon={LayoutList} title="Nothing to moderate" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image src={l.images[0]} alt="" width={56} height={42} className="h-10 w-14 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <Link
                            href={`/property/${l.id}`}
                            className="flex max-w-72 items-center gap-1 text-sm font-semibold hover:underline"
                          >
                            <span className="truncate">{l.title}</span>
                            <ExternalLink className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {l.city} · {timeAgo(l.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLE[l.status]}>{l.status === "pending-review" ? "Pending review" : l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationBadge status={l.verification} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatGHS(l.price)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {(l.status === "flagged" || l.status === "pending-review" || l.status === "paused") && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Approve listing"
                            className="text-success hover:text-success"
                            disabled={act.isPending}
                            onClick={() => act.mutate({ id: l.id, action: "approve" })}
                          >
                            <CheckCircle2 />
                          </Button>
                        )}
                        {l.status === "active" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Flag listing"
                            className="text-warning-foreground/80 hover:text-warning-foreground dark:text-warning"
                            disabled={act.isPending}
                            onClick={() => act.mutate({ id: l.id, action: "flag" })}
                          >
                            <Flag />
                          </Button>
                        )}
                        {l.status === "flagged" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Restore listing"
                            disabled={act.isPending}
                            onClick={() => act.mutate({ id: l.id, action: "restore" })}
                          >
                            <Undo2 />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove listing"
                          className="text-destructive hover:text-destructive"
                          disabled={act.isPending}
                          onClick={() => act.mutate({ id: l.id, action: "remove" })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
