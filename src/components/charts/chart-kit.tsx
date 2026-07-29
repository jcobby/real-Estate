"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Chart primitives following the dataviz method:
 * one axis per chart (no dual axes — different magnitudes get small multiples),
 * thin marks with rounded data-ends, recessive grid, text in text tokens,
 * hover tooltips by default, legend whenever ≥2 series.
 */

const GRID = "var(--border)";
const TICK = { fontSize: 11, fill: "var(--muted-foreground)" } as const;

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  formatter?: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-popover-foreground shadow-md">
      <p className="text-xs font-semibold">{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} className="mt-0.5 flex items-center gap-1.5 text-xs">
          <span className="size-2 rounded-sm" style={{ backgroundColor: entry.color }} aria-hidden />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold">{formatter ? formatter(entry.value) : entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
}

function LegendRow({ series }: { series: Array<{ name: string; color: string }> }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1" aria-hidden>
      {series.map((s) => (
        <span key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

export interface SeriesSpec {
  key: string;
  name: string;
  color: string; // css var like "var(--chart-1)"
}

export function TrendLineChart({
  title,
  data,
  xKey,
  series,
  formatter,
  className,
  height = 220,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: SeriesSpec[];
  formatter?: (v: number) => string;
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn("gap-3 rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <LegendRow series={series} />
      </div>
      <div style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -14 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={54} />
            <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ stroke: GRID }} />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function TrendBarChart({
  title,
  data,
  xKey,
  series,
  formatter,
  className,
  height = 220,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: SeriesSpec[];
  formatter?: (v: number) => string;
  className?: string;
  height?: number;
}) {
  return (
    <Card className={cn("gap-3 rounded-2xl p-5", className)}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <LegendRow series={series} />
      </div>
      <div style={{ height }} role="img" aria-label={title}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 12, bottom: 0, left: -14 }} barGap={2}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} tick={TICK} axisLine={false} tickLine={false} />
            <YAxis tick={TICK} axisLine={false} tickLine={false} width={54} />
            <Tooltip content={<ChartTooltip formatter={formatter} />} cursor={{ fill: "var(--muted)" }} />
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={14} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

/** Horizontal category breakdown — single hue, value labels at bar ends. */
export function CategoryBars({
  title,
  items,
  formatter,
  className,
}: {
  title: string;
  items: Array<{ label: string; value: number }>;
  formatter?: (v: number) => string;
  className?: string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <Card className={cn("gap-4 rounded-2xl p-5", className)}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.label}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
              <span className="truncate text-muted-foreground">{item.label}</span>
              <span className="font-semibold">{formatter ? formatter(item.value) : item.value.toLocaleString()}</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted" role="presentation">
              <div
                className="h-full rounded-full"
                style={{ width: `${(item.value / max) * 100}%`, backgroundColor: "var(--chart-2)" }}
              />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
