import { Check, CircleDashed, LockKeyhole } from "lucide-react";
import type { EscrowStep } from "@/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function EscrowTimeline({ steps, compact = false }: { steps: EscrowStep[]; compact?: boolean }) {
  return (
    <ol className={cn("relative", compact ? "flex items-center gap-0" : "space-y-0")} aria-label="Escrow progress">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        if (compact) {
          return (
            <li key={step.key} className="flex flex-1 items-center" aria-current={step.status === "current" ? "step" : undefined}>
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                  step.status === "complete" && "bg-success text-success-foreground",
                  step.status === "current" && "bg-primary text-primary-foreground",
                  step.status === "pending" && "bg-muted text-muted-foreground",
                )}
                title={step.label}
              >
                {step.status === "complete" ? <Check className="size-3" /> : i + 1}
              </span>
              {!isLast && (
                <span className={cn("h-0.5 flex-1", step.status === "complete" ? "bg-success" : "bg-border")} aria-hidden />
              )}
            </li>
          );
        }
        return (
          <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0" aria-current={step.status === "current" ? "step" : undefined}>
            {!isLast && (
              <span
                className={cn("absolute top-9 left-4.5 h-[calc(100%-2.5rem)] w-0.5", step.status === "complete" ? "bg-success" : "bg-border")}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-full",
                step.status === "complete" && "bg-success text-success-foreground",
                step.status === "current" && "bg-primary text-primary-foreground ring-4 ring-primary/25",
                step.status === "pending" && "bg-muted text-muted-foreground",
              )}
            >
              {step.status === "complete" ? (
                <Check className="size-4" aria-hidden />
              ) : step.status === "current" ? (
                <LockKeyhole className="size-4" aria-hidden />
              ) : (
                <CircleDashed className="size-4" aria-hidden />
              )}
            </span>
            <div className="pt-1">
              <p className={cn("text-sm font-semibold", step.status === "pending" && "text-muted-foreground")}>{step.label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
              {step.date && <p className="mt-1 text-[11px] font-medium text-success">{formatDate(step.date)}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
