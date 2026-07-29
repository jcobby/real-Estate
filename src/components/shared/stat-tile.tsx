import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  trend,
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  trend?: { value: string; positive: boolean };
  className?: string;
}) {
  return (
    <Card className={cn("gap-2 rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{label}</p>
        {Icon && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="font-heading text-2xl font-bold tracking-tight">{value}</p>
      {(hint || trend) && (
        <p className="text-xs text-muted-foreground">
          {trend && (
            <span className={cn("mr-1.5 font-semibold", trend.positive ? "text-success" : "text-destructive")}>
              {trend.value}
            </span>
          )}
          {hint}
        </p>
      )}
    </Card>
  );
}
