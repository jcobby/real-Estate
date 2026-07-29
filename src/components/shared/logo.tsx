import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect x="1.5" y="1.5" width="13" height="13" rx="3.5" className="fill-secondary dark:fill-muted" />
      <rect x="17.5" y="1.5" width="13" height="13" rx="3.5" className="fill-secondary/60 dark:fill-muted/70" />
      <rect x="1.5" y="17.5" width="13" height="13" rx="3.5" className="fill-secondary/60 dark:fill-muted/70" />
      <rect x="17.5" y="17.5" width="13" height="13" rx="3.5" className="fill-primary" />
      <path d="M24.5 21.5v6M21.5 24.5h6" className="stroke-primary-foreground" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, textClassName }: { className?: string; textClassName?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)} aria-label="RealEstate — home">
      <LogoMark />
      <span className={cn("font-heading text-xl leading-none tracking-tight", textClassName)}>
        <span className="font-bold">Real</span>
        <span className="font-normal">Estate</span>
      </span>
    </Link>
  );
}
