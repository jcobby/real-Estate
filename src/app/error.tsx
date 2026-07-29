"use client";

import { useEffect } from "react";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary:", error);
  }, [error]);

  return (
    <main className="page-container flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-destructive/10">
        <TriangleAlert className="size-7 text-destructive" aria-hidden />
      </span>
      <h1 className="mt-5 font-heading text-2xl font-bold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error interrupted the page. Your data is safe — try again, and if it keeps happening please
        contact support.
      </p>
      <Button size="lg" className="mt-8" onClick={reset}>
        <RotateCcw data-icon="inline-start" /> Try again
      </Button>
    </main>
  );
}
