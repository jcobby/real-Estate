import { LogoMark } from "@/components/shared/logo";
import { ShieldCheck } from "lucide-react";

/** Split auth layout — form on the left, brand panel on the right. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="page-container grid min-h-[calc(100dvh-4rem)] items-center gap-10 py-10 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-md">
        <h1 className="font-heading text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-8">{children}</div>
        <p className="mt-8 rounded-xl bg-accent px-4 py-3 text-xs leading-relaxed text-accent-foreground">
          <ShieldCheck className="mr-1.5 inline size-3.5" aria-hidden />
          Your details are encrypted and your land purchases are protected by escrow.
        </p>
      </div>

      <div className="relative hidden h-full min-h-130 overflow-hidden rounded-3xl bg-secondary text-secondary-foreground lg:block">
        <div className="topo-bg absolute inset-0 opacity-50" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <LogoMark className="size-12" />
          <div>
            <p className="font-heading text-3xl leading-snug font-bold text-balance">
              “I picked my plots on the map from London and tracked every step until the title was in my name.”
            </p>
            <p className="mt-4 text-sm text-secondary-foreground/70">Akua Owusu — bought 2 plots at Oyibi Hillcrest</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-xs font-medium">
            {["Verified titles", "Escrow payments", "Plot monitoring", "Scam protection"].map((f) => (
              <li key={f} className="rounded-full border border-secondary-foreground/20 px-3 py-1">
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
