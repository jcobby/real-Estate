"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ExternalLink, FileQuestion, FileText, Play, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/empty-state";
import {
  VC_STATUS_LABEL,
  VC_STATUS_STYLE,
  VerificationTimeline,
} from "@/components/verification/verification-timeline";
import { getVerificationCases, reviewVerificationCase, type ReviewAction } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { VerificationCase, VerificationCaseStatus } from "@/types";
import { cn } from "@/lib/utils";

const TABS: Array<{ value: VerificationCaseStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "submitted", label: "New" },
  { value: "under-review", label: "Under review" },
  { value: "docs-requested", label: "Docs requested" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
];

export default function AdminVerificationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<VerificationCaseStatus | "all">("all");
  const [noteAction, setNoteAction] = useState<{ vc: VerificationCase; action: ReviewAction } | null>(null);
  const [note, setNote] = useState("");

  const { data: cases, isPending } = useQuery({
    queryKey: ["verification-cases", tab],
    queryFn: () => getVerificationCases(tab),
  });

  const review = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: ReviewAction; note?: string }) =>
      reviewVerificationCase(id, action, note),
    onSuccess: (vc, vars) => {
      queryClient.invalidateQueries({ queryKey: ["verification-cases"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      setNoteAction(null);
      setNote("");
      toast.success(
        vars.action === "approve"
          ? `“${vc?.listingTitle}” is now Verified — badge issued`
          : vars.action === "reject"
            ? "Case rejected and seller notified"
            : vars.action === "request-docs"
              ? "Documents requested from the seller"
              : "Review started",
      );
    },
  });

  const act = (vc: VerificationCase, action: ReviewAction) => {
    if (action === "reject" || action === "request-docs") {
      setNoteAction({ vc, action });
      setNote("");
      return;
    }
    review.mutate({ id: vc.id, action });
  };

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold tracking-tight">Verification queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Check seller documents against Lands Commission records, then approve or reject.
      </p>

      <div role="tablist" aria-label="Filter cases" className="no-scrollbar mt-5 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              tab === t.value
                ? "border-transparent bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-5">
        {isPending ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)
        ) : !cases || cases.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="Queue is clear" description="No cases in this state right now." />
        ) : (
          cases.map((vc) => (
            <Card key={vc.id} className="gap-5 rounded-2xl p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-heading text-base font-semibold">
                    <span className="truncate">{vc.listingTitle}</span>
                    <Link
                      href={`/property/${vc.listingId}`}
                      className="text-muted-foreground hover:text-primary"
                      aria-label="Open listing"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {vc.sellerName} · submitted {formatDate(vc.submittedAt)} · case {vc.id}
                  </p>
                </div>
                <Badge className={VC_STATUS_STYLE[vc.status]}>{VC_STATUS_LABEL[vc.status]}</Badge>
              </div>

              <VerificationTimeline vc={vc} />

              <div className="grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">
                    Documents ({vc.documents.length})
                  </p>
                  <ul className="space-y-2">
                    {vc.documents.map((doc) => (
                      <li key={doc.id} className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm">
                        <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">{doc.name}</span>
                        <span className="text-xs text-muted-foreground">{doc.sizeKb} KB</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">Checks</p>
                  <ul className="space-y-1.5">
                    {vc.checks.map((check) => (
                      <li key={check.label} className="flex items-center gap-2 text-sm">
                        <span
                          className={
                            check.passed === true
                              ? "text-success"
                              : check.passed === false
                                ? "text-destructive"
                                : "text-muted-foreground"
                          }
                        >
                          {check.passed === true ? "✓" : check.passed === false ? "✗" : "•"}
                        </span>
                        <span className={check.passed == null ? "text-muted-foreground" : ""}>{check.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {(vc.status === "submitted" || vc.status === "under-review" || vc.status === "docs-requested") && (
                <div className="flex flex-wrap gap-2 border-t pt-4">
                  {vc.status === "submitted" && (
                    <Button variant="outline" size="sm" disabled={review.isPending} onClick={() => act(vc, "start-review")}>
                      <Play data-icon="inline-start" /> Start review
                    </Button>
                  )}
                  <Button variant="outline" size="sm" disabled={review.isPending} onClick={() => act(vc, "request-docs")}>
                    <FileQuestion data-icon="inline-start" /> Request docs
                  </Button>
                  <span className="flex-1" />
                  <Button variant="destructive" size="sm" disabled={review.isPending} onClick={() => act(vc, "reject")}>
                    <X data-icon="inline-start" /> Reject
                  </Button>
                  <Button size="sm" disabled={review.isPending} onClick={() => act(vc, "approve")}>
                    <BadgeCheck data-icon="inline-start" /> Approve &amp; issue badge
                  </Button>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={!!noteAction} onOpenChange={(open) => !open && setNoteAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {noteAction?.action === "reject" ? "Reject this case" : "Request more documents"}
            </DialogTitle>
            <DialogDescription>
              The note is sent to {noteAction?.vc.sellerName} with the status change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="review-note">Note to seller</Label>
            <Textarea
              id="review-note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                noteAction?.action === "reject"
                  ? "e.g. Indenture conflicts with an existing registration…"
                  : "e.g. Please upload the licensed surveyor's report…"
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteAction(null)}>
              Cancel
            </Button>
            <Button
              variant={noteAction?.action === "reject" ? "destructive" : "default"}
              disabled={note.trim().length < 5 || review.isPending}
              onClick={() => noteAction && review.mutate({ id: noteAction.vc.id, action: noteAction.action, note: note.trim() })}
            >
              {review.isPending ? "Sending…" : noteAction?.action === "reject" ? "Reject case" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
