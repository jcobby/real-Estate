"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  count,
  size = "sm",
  interactive = false,
  onChange,
  className,
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}) {
  const starSize = { sm: "size-3.5", md: "size-4.5", lg: "size-6" }[size];
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role={interactive ? "radiogroup" : undefined}
        aria-label={interactive ? "Choose a rating" : `Rated ${rating} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= Math.round(rating);
          const star = (
            <Star
              key={i}
              className={cn(starSize, filled ? "fill-primary text-primary" : "fill-muted text-muted")}
              aria-hidden
            />
          );
          if (!interactive) return star;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={i === Math.round(rating)}
              aria-label={`${i} star${i > 1 ? "s" : ""}`}
              className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onChange?.(i)}
            >
              {star}
            </button>
          );
        })}
      </div>
      {rating > 0 && <span className="text-sm font-semibold">{rating.toFixed(1)}</span>}
      {count != null && <span className="text-xs text-muted-foreground">({count})</span>}
    </div>
  );
}
