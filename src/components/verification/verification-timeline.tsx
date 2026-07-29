import { Check, CircleDashed, FileQuestion, X } from "lucide-react";
import type { VerificationCase, VerificationCaseStatus } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const VC_STATUS_LABEL: Record<VerificationCaseStatus, string> = {
  submitted: "Submitted",
  "under-review": "Under review",
  "docs-requested": "Docs requested",
  verified: "Verified",
  rejected: "Rejected",
};

export const VC_STATUS_STYLE: Record<VerificationCaseStatus, string> = {
  submitted: "bg-chart-3/20 text-foreground",
  "under-review": "bg-warning text-warning-foreground",
  "docs-requested": "bg-warning/20 text-warning-foreground dark:text-warning",
  verified: "bg-success text-success-foreground",
  rejected: "bg-destructive/15 text-destructive",
};

/** Horizontal state timeline: Submitted → Under review → (Docs requested) → Verified/Rejected */
export function VerificationTimeline({ vc }: { vc: VerificationCase }) {
  const terminal = vc.status === "rejected" ? "rejected" : "verified";
  const flow: VerificationCaseStatus[] = ["submitted", "under-review", ...(vc.timeline.some((t) => t.status === "docs-requested") ? (["docs-requested"] as const) : []), terminal];
  const reachedIndex = Math.max(...vc.timeline.map((t) => flow.indexOf(t.status)).filter((i) => i >= 0), 0);

  return (
    <ol className="flex flex-wrap items-center gap-y-3" aria-label="Verification timeline">
      {flow.map((status, i) => {
        const entry = vc.timeline.find((t) => t.status === status);
        const reached = i <= reachedIndex && !!entry;
        const isCurrent = status === vc.status;
        const isLast = i === flow.length - 1;
        const failed = status === "rejected";
        return (
          <li key={status} className="flex items-center" aria-current={isCurrent ? "step" : undefined}>
            <div className="flex flex-col items-center gap-1 text-center">
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full border-2",
                  reached
                    ? failed
                      ? "border-destructive bg-destructive text-white"
                      : "border-success bg-success text-success-foreground"
                    : "border-border bg-muted text-muted-foreground",
                  isCurrent && !failed && status !== "verified" && "border-primary bg-primary text-primary-foreground",
                )}
              >
                {failed && reached ? (
                  <X className="size-4" aria-hidden />
                ) : reached ? (
                  <Check className="size-4" aria-hidden />
                ) : status === "docs-requested" ? (
                  <FileQuestion className="size-4" aria-hidden />
                ) : (
                  <CircleDashed className="size-4" aria-hidden />
                )}
              </span>
              <span className={cn("max-w-24 text-[11px] leading-tight font-medium", !reached && "text-muted-foreground")}>
                {VC_STATUS_LABEL[status]}
                {entry?.date && <span className="block text-[10px] font-normal text-muted-foreground">{formatDate(entry.date)}</span>}
              </span>
            </div>
            {!isLast && <span className={cn("mx-2 mb-5 h-0.5 w-8 sm:w-14", i < reachedIndex ? "bg-success" : "bg-border")} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
