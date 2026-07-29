import { cn } from "@/lib/utils";

export function SectionHeading({
  kicker,
  title,
  subtitle,
  align = "left",
  className,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {kicker && (
        <p className="mb-2 inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-primary uppercase">
          <span className="inline-block h-px w-6 bg-primary" aria-hidden />
          {kicker}
          {align === "center" && <span className="inline-block h-px w-6 bg-primary" aria-hidden />}
        </p>
      )}
      <h2 className="font-heading text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">{subtitle}</p>}
    </div>
  );
}
