import { PLOT_COLORS } from "./map-style";

const ITEMS = [
  { color: PLOT_COLORS.available, label: "Available for sale" },
  { color: PLOT_COLORS.reserved, label: "Reserved" },
  { color: PLOT_COLORS.sold, label: "Unavailable — sold" },
  { color: PLOT_COLORS.selected, label: "Your selection" },
] as const;

export function MapLegend() {
  return (
    <div
      aria-label="Map legend"
      className="absolute bottom-8 left-3 z-10 hidden rounded-xl bg-background/90 px-3.5 py-2.5 shadow-md backdrop-blur-sm sm:block"
    >
      <ul className="space-y-1.5">
        {ITEMS.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs font-medium">
            <span className="size-3 rounded-sm border border-white/60" style={{ backgroundColor: item.color }} aria-hidden />
            {item.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 max-w-44 border-t pt-1.5 text-[10px] leading-snug text-muted-foreground">
        Zoom in to see plot numbers. Tap an available plot to select it.
      </p>
    </div>
  );
}
