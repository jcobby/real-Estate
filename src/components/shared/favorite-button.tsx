"use client";

import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/stores/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  listingId,
  className,
  withLabel = false,
}: {
  listingId: string;
  className?: string;
  withLabel?: boolean;
}) {
  const favorites = useFavorites((s) => s.favorites);
  const toggleFavorite = useFavorites((s) => s.toggleFavorite);
  const active = favorites.includes(listingId);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(listingId);
        toast(active ? "Removed from favorites" : "Saved to favorites", {
          description: active ? undefined : "Find it under Dashboard → Favorites.",
        });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-background/90 p-2 text-foreground shadow-sm backdrop-blur-sm transition-all outline-none hover:scale-110 focus-visible:ring-3 focus-visible:ring-ring/50",
        withLabel && "px-3",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-destructive text-destructive")} aria-hidden />
      {withLabel && <span className="text-xs font-semibold">{active ? "Saved" : "Save"}</span>}
    </button>
  );
}
