"use client";

import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGHS } from "@/lib/format";

const TERM_ITEMS = [
  { value: "1", label: "1 year" },
  { value: "2", label: "2 years" },
  { value: "3", label: "3 years" },
  { value: "5", label: "5 years" },
];

export function AffordabilityCalculator({ price }: { price: number }) {
  const [amount, setAmount] = useState(price);
  const [depositPct, setDepositPct] = useState(30);
  const [rate, setRate] = useState(24);
  const [years, setYears] = useState("2");

  const result = useMemo(() => {
    const principal = amount * (1 - depositPct / 100);
    const n = Number(years) * 12;
    const r = rate / 100 / 12;
    const monthly = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
    return {
      deposit: amount * (depositPct / 100),
      monthly,
      totalInterest: monthly * n - principal,
    };
  }, [amount, depositPct, rate, years]);

  return (
    <Card className="gap-5 rounded-2xl p-5">
      <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
        <Calculator className="size-4.5 text-primary" aria-hidden />
        Affordability calculator
      </h3>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="calc-price">Land price (₵)</Label>
          <Input
            id="calc-price"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(+e.target.value || 0)}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="calc-deposit">Deposit</Label>
            <span className="text-sm font-semibold">
              {depositPct}% · {formatGHS(result.deposit)}
            </span>
          </div>
          <Slider
            id="calc-deposit"
            min={10}
            max={90}
            step={5}
            value={[depositPct]}
            onValueChange={(v) => setDepositPct((v as number[])[0])}
            aria-label="Deposit percentage"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="calc-rate">Interest rate (%/yr)</Label>
            <Input
              id="calc-rate"
              type="number"
              min={0}
              max={60}
              value={rate}
              onChange={(e) => setRate(+e.target.value || 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="calc-term">Term</Label>
            <Select items={TERM_ITEMS} value={years} onValueChange={(v) => setYears(v as string)}>
              <SelectTrigger id="calc-term" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERM_ITEMS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-accent p-4 text-accent-foreground">
        <p className="text-xs font-medium uppercase">Estimated monthly payment</p>
        <p className="mt-1 font-heading text-2xl font-bold">{formatGHS(result.monthly)}</p>
        <p className="mt-1 text-xs opacity-80">
          Total interest {formatGHS(Math.max(0, result.totalInterest))} · estimate only, not a loan offer
        </p>
      </div>
    </Card>
  );
}
