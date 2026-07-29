const PARTNERS = [
  "Lands Commission aligned",
  "GhIS surveyors",
  "MTN MoMo",
  "Telecel Cash",
  "Paystack",
  "Flutterwave",
  "GREDA members",
];

export function PartnersStrip() {
  return (
    <section aria-label="Partners and integrations" className="border-t">
      <div className="page-container flex flex-wrap items-center justify-center gap-x-10 gap-y-4 py-10">
        {PARTNERS.map((p) => (
          <span
            key={p}
            className="font-heading text-sm font-bold tracking-wide text-muted-foreground/60 uppercase"
          >
            {p}
          </span>
        ))}
      </div>
    </section>
  );
}
