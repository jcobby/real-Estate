"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutList, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { deleteListing, getSellerListings, updateListing } from "@/lib/api";
import { useSession } from "@/stores/session";
import { formatGHS, formatNumber, timeAgo } from "@/lib/format";
import type { Listing, ListingLifecycle } from "@/types";

const STATUS_STYLE: Partial<Record<ListingLifecycle, string>> = {
  active: "bg-success text-success-foreground",
  paused: "bg-muted text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  "pending-review": "bg-warning text-warning-foreground",
  flagged: "bg-destructive/15 text-destructive",
};

export default function SellerListingsPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Listing | null>(null);

  const { data: listings, isPending } = useQuery({
    queryKey: ["seller-listings", user.id],
    queryFn: () => getSellerListings(user.id),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["seller-listings", user.id] });

  const togglePause = useMutation({
    mutationFn: (l: Listing) => updateListing(l.id, { status: l.status === "paused" ? "active" : "paused" }),
    onSuccess: (l) => {
      invalidate();
      toast.success(l?.status === "paused" ? "Listing paused" : "Listing is live again");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteListing(id),
    onSuccess: () => {
      invalidate();
      setDeleting(null);
      toast.success("Listing removed");
    },
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">My listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">{listings?.length ?? "…"} listings</p>
        </div>
        <Button render={<Link href="/seller/listings/new" />}>
          <Plus data-icon="inline-start" /> New listing
        </Button>
      </div>

      <div className="mt-6">
        {isPending ? (
          <Skeleton className="h-96 rounded-2xl" />
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            icon={LayoutList}
            title="No listings yet"
            description="Run the guided wizard to publish your first plot in minutes."
            action={
              <Button render={<Link href="/seller/listings/new" />}>
                <Plus data-icon="inline-start" /> Create a listing
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-2xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Leads</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={l.images[0]}
                          alt=""
                          width={56}
                          height={42}
                          className="h-10 w-14 shrink-0 rounded-lg object-cover"
                        />
                        <div className="min-w-0">
                          <Link href={`/property/${l.id}`} className="line-clamp-1 max-w-64 text-sm font-semibold hover:underline">
                            {l.title}
                          </Link>
                          <p className="text-xs text-muted-foreground">
                            {l.city} · listed {timeAgo(l.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_STYLE[l.status]}>{l.status === "pending-review" ? "In review" : l.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <VerificationBadge status={l.verification} />
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatGHS(l.price)}</TableCell>
                    <TableCell className="text-right">{formatNumber(l.views)}</TableCell>
                    <TableCell className="text-right">{l.leads}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" aria-label={`Edit ${l.title}`} render={<Link href={`/seller/listings/${l.id}/edit`} />}>
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={l.status === "paused" ? "Resume listing" : "Pause listing"}
                          disabled={togglePause.isPending || l.status === "draft"}
                          onClick={() => togglePause.mutate(l)}
                        >
                          {l.status === "paused" ? <Play /> : <Pause />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Delete ${l.title}`}
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleting(l)}
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

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this listing?</DialogTitle>
            <DialogDescription>
              &ldquo;{deleting?.title}&rdquo; will be removed from the marketplace. Buyers who favorited it will no
              longer see it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={remove.isPending} onClick={() => deleting && remove.mutate(deleting.id)}>
              {remove.isPending ? "Removing…" : "Delete listing"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
