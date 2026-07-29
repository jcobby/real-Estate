import Link from "next/link";
import { Compass, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="page-container flex min-h-[70dvh] flex-col items-center justify-center py-16 text-center">
      <p className="font-heading text-7xl font-bold text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight">This plot doesn&apos;t exist</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for was moved, sold, or never surveyed. Let&apos;s get you back to solid ground.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" render={<Link href="/" />}>
          <Compass data-icon="inline-start" /> Back home
        </Button>
        <Button variant="outline" size="lg" render={<Link href="/map" />}>
          <Map data-icon="inline-start" /> Browse the map
        </Button>
      </div>
    </main>
  );
}
