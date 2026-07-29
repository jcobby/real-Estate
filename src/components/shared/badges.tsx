import { BadgeCheck, CircleDashed, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LandStatus, PlotStatus, VerificationStatus } from "@/types";
import { cn } from "@/lib/utils";

export function VerificationBadge({
  status,
  className,
  size = "default",
}: {
  status: VerificationStatus;
  className?: string;
  size?: "default" | "lg";
}) {
  const config = {
    verified: { icon: BadgeCheck, label: "Verified", cls: "bg-success text-success-foreground border-transparent" },
    pending: { icon: CircleDashed, label: "Verification pending", cls: "bg-warning text-warning-foreground border-transparent" },
    unverified: { icon: ShieldAlert, label: "Unverified", cls: "bg-muted text-muted-foreground" },
  }[status];
  const Icon = config.icon;
  return (
    <Badge className={cn(config.cls, size === "lg" && "px-3 py-1 text-sm", className)}>
      <Icon className={size === "lg" ? "size-4" : "size-3"} />
      {config.label}
    </Badge>
  );
}

export const LAND_STATUS_LABEL: Record<LandStatus, string> = {
  developed: "Developed",
  "semi-developed": "Semi-developed",
  greenfield: "Greenfield",
  undeveloped: "Undeveloped",
};

export function LandStatusBadge({ status, className }: { status: LandStatus; className?: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        "border-transparent",
        status === "developed" && "bg-secondary text-secondary-foreground",
        status === "semi-developed" && "bg-chart-3/20 text-foreground",
        status === "greenfield" && "bg-success/15 text-success dark:text-success",
        status === "undeveloped" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {LAND_STATUS_LABEL[status]}
    </Badge>
  );
}

export const PLOT_STATUS_LABEL: Record<PlotStatus, string> = {
  available: "Available for sale",
  reserved: "Reserved",
  sold: "Unavailable — sold",
};

export function PlotStatusBadge({ status, className }: { status: PlotStatus; className?: string }) {
  return (
    <Badge
      className={cn(
        "border-transparent",
        status === "available" && "bg-success text-success-foreground",
        status === "reserved" && "bg-warning text-warning-foreground",
        status === "sold" && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {PLOT_STATUS_LABEL[status]}
    </Badge>
  );
}
