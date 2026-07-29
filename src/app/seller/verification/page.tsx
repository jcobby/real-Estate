"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FileCheck2, FileText, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dropzone } from "@/components/shared/dropzone";
import { EmptyState } from "@/components/shared/empty-state";
import { VerificationTimeline, VC_STATUS_STYLE, VC_STATUS_LABEL } from "@/components/verification/verification-timeline";
import {
  getSellerListings,
  getSellerVerificationCases,
  submitVerification,
} from "@/lib/api";
import { describeError } from "@/lib/api/http";
import { uploadFile } from "@/lib/api/uploads";
import { useSession } from "@/stores/session";
import { formatDate } from "@/lib/format";

export default function SellerVerificationPage() {
  const { session } = useSession();
  const user = session!.user;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [listingId, setListingId] = useState<string | null>(null);
  const [docs, setDocs] = useState<Array<{ name: string; type: string; sizeKb: number; storageKey: string }>>([]);

  const { data: cases, isPending } = useQuery({
    queryKey: ["seller-verification", user.id],
    queryFn: () => getSellerVerificationCases(user.id),
  });
  const { data: listings = [] } = useQuery({
    queryKey: ["seller-listings", user.id],
    queryFn: () => getSellerListings(user.id),
  });

  const submittableListings = listings.filter(
    (l) => l.verification !== "verified" && !cases?.some((c) => c.listingId === l.id && ["submitted", "under-review", "docs-requested"].includes(c.status)),
  );

  const submit = useMutation({
    mutationFn: () => {
      const listing = listings.find((l) => l.id === listingId)!;
      return submitVerification({
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: user.id,
        sellerName: user.name,
        documents: docs.map((d) => ({ name: d.name, type: d.type as never, sizeKb: d.sizeKb, storageKey: d.storageKey })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-verification", user.id] });
      setOpen(false);
      setDocs([]);
      setListingId(null);
      toast.success("Submitted for verification", {
        description: "Our documents team will review it shortly.",
      });
    },
  });

  const addDocs = async (files: File[]) => {
    const tid = toast.loading(`Uploading ${files.length} document${files.length > 1 ? "s" : ""}…`);
    try {
      const uploaded = await Promise.all(
        files.map(async (f) => {
          const { storageKey } = await uploadFile(f, "verification-doc");
          return {
            name: f.name,
            type: /indenture/i.test(f.name)
              ? "indenture"
              : /site/i.test(f.name)
                ? "site-plan"
                : /survey/i.test(f.name)
                  ? "surveyor-report"
                  : /id|ghana.?card/i.test(f.name)
                    ? "id"
                    : "other",
            sizeKb: Math.max(1, Math.round(f.size / 1024)),
            storageKey,
          };
        }),
      );
      setDocs((d) => [...d, ...uploaded]);
      toast.success(`${files.length} document${files.length > 1 ? "s" : ""} attached`, { id: tid });
    } catch (e) {
      toast.error("Couldn't upload the documents", { id: tid, description: describeError(e) });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Land verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verified listings earn the trust badge and ~4× more leads.
          </p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={submittableListings.length === 0}>
          <Plus data-icon="inline-start" /> Submit a listing
        </Button>
      </div>

      <div className="mt-6 space-y-5">
        {isPending ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)
        ) : !cases || cases.length === 0 ? (
          <EmptyState
            icon={FileCheck2}
            title="No verification cases yet"
            description="Upload your indenture, site plan and surveyor's report to get the Verified badge."
            action={
              <Button onClick={() => setOpen(true)} disabled={submittableListings.length === 0}>
                <Plus data-icon="inline-start" /> Start verification
              </Button>
            }
          />
        ) : (
          cases.map((vc) => (
            <Card key={vc.id} className="gap-5 rounded-2xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-heading text-base font-semibold">{vc.listingTitle}</p>
                  <p className="text-xs text-muted-foreground">Submitted {formatDate(vc.submittedAt)} · {vc.documents.length} documents</p>
                </div>
                <Badge className={VC_STATUS_STYLE[vc.status]}>{VC_STATUS_LABEL[vc.status]}</Badge>
              </div>

              <VerificationTimeline vc={vc} />

              {vc.adminNote && (
                <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
                  <span className="font-semibold">Reviewer note:</span> {vc.adminNote}
                </p>
              )}

              <div>
                <p className="mb-2 text-xs font-bold tracking-wide text-muted-foreground uppercase">What gets checked</p>
                <ul className="grid gap-1.5 sm:grid-cols-2">
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
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit a listing for verification</DialogTitle>
            <DialogDescription>
              Upload ownership documents — our team checks them against Lands Commission records.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vc-listing">Listing</Label>
              <Select
                items={submittableListings.map((l) => ({ value: l.id, label: l.title }))}
                value={listingId}
                onValueChange={(v) => setListingId(v as string)}
              >
                <SelectTrigger id="vc-listing" className="w-full">
                  <SelectValue placeholder="Choose a listing" />
                </SelectTrigger>
                <SelectContent>
                  {submittableListings.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dropzone
              label="Drop documents here"
              hint="Indenture, site plan, surveyor's report, national ID"
              accept=".pdf,.jpg,.png"
              onFiles={addDocs}
            />

            {docs.length > 0 && (
              <ul className="space-y-2">
                {docs.map((doc, i) => (
                  <li key={`${doc.name}-${i}`} className="flex items-center gap-3 rounded-xl border px-4 py-2.5">
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-sm">{doc.name}</span>
                    <span className="text-xs text-muted-foreground">{doc.sizeKb} KB</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${doc.name}`}
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDocs((d) => d.filter((_, idx) => idx !== i))}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!listingId || docs.length === 0 || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? (
                <>
                  <LoaderCircle data-icon="inline-start" className="animate-spin" /> Submitting…
                </>
              ) : (
                <>
                  <BadgeCheck data-icon="inline-start" /> Submit for review
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
