"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Circle, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { register as registerApi } from "@/lib/api";
import { ApiError, describeError } from "@/lib/api/http";
import { useSession, roleHome } from "@/stores/session";
import type { Role } from "@/types";
import { cn } from "@/lib/utils";

const REGIONS = ["Greater Accra", "Ashanti", "Eastern", "Northern", "Central", "Volta", "Western", "Upper West"];

const CATEGORIES = [
  { value: "surveyor", label: "Surveyor" },
  { value: "property-manager", label: "Property manager" },
  { value: "developer", label: "Developer / builder" },
  { value: "painter", label: "Painter" },
  { value: "electrician", label: "Electrician" },
  { value: "plumber", label: "Plumber" },
  { value: "photographer", label: "Photographer" },
];

/** Normalise a Ghana number to +233XXXXXXXXX (backend requires ^(\+233|233|0)\d{9}$). */
function normalizeGhPhone(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("233")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  return d.length === 9 ? `+233${d}` : input.trim();
}

const schema = z.object({
  name: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .refine((v) => /^\+233\d{9}$/.test(normalizeGhPhone(v)), "Enter a valid Ghana phone number, e.g. 024 123 4567"),
  password: z
    .string()
    .min(10, "At least 10 characters")
    .regex(/[A-Za-z]/, "Include at least one letter")
    .regex(/[0-9]/, "Include at least one number"),
  region: z.string().min(1, "Pick your region"),
  company: z.string().optional(),
  category: z.string().optional(),
  budget: z.string().optional(),
  terms: z.boolean().refine((v) => v, "You must accept the terms to continue"),
});

type FormValues = z.infer<typeof schema>;

const STEP_FIELDS: Record<number, (keyof FormValues)[]> = {
  0: ["name", "email", "phone", "password"],
  1: ["region", "company", "category", "budget"],
  2: ["terms"],
};

export function RegisterWizard({ role }: { role: Role }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useSession((s) => s.setSession);
  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { region: "", terms: false },
    mode: "onTouched",
  });

  const values = watch();

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => s + 1);
  };

  const onSubmit = async (v: FormValues) => {
    try {
      const session = await registerApi({
        name: v.name,
        email: v.email,
        phone: normalizeGhPhone(v.phone),
        role,
        region: v.region,
        company: v.company || undefined,
        password: v.password,
      });
      setSession(session);
      toast.success("Account created — welcome to RealEstate!");
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : role === "seller" ? "/seller" : roleHome[role]);
    } catch (e) {
      // Map the backend's field errors back onto the form and jump to the step
      // that holds the first offending field so the user sees exactly what to fix.
      if (e instanceof ApiError && e.fieldErrors) {
        let jump = step;
        for (const [field, message] of Object.entries(e.fieldErrors)) {
          if (field in schema.shape) {
            setError(field as keyof FormValues, { message });
            const s = Number(
              Object.keys(STEP_FIELDS).find((k) => STEP_FIELDS[Number(k)].includes(field as keyof FormValues)),
            );
            if (!Number.isNaN(s)) jump = Math.min(jump, s);
          }
        }
        setStep(jump);
        toast.error("Please fix the highlighted fields", { description: Object.values(e.fieldErrors)[0] });
      } else {
        toast.error("Couldn't create your account", { description: describeError(e) });
      }
    }
  };

  const steps = ["Account", role === "buyer" ? "Preferences" : "Business", "Confirm"];

  const err = (k: keyof FormValues) =>
    errors[k] && (
      <p role="alert" className="text-xs font-medium text-destructive">
        {errors[k]?.message as string}
      </p>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <ol className="mb-8 flex items-center gap-2" aria-label="Registration progress">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                i < step
                  ? "bg-success text-success-foreground"
                  : i === step
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
              {label}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Full name</Label>
            <Input id="reg-name" autoComplete="name" placeholder="Ama Serwaa" aria-invalid={!!errors.name} {...register("name")} />
            {err("name")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">Email</Label>
            <Input id="reg-email" type="email" autoComplete="email" placeholder="ama@example.com" aria-invalid={!!errors.email} {...register("email")} />
            {err("email")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone">Phone (MoMo-enabled)</Label>
            <Input id="reg-phone" type="tel" autoComplete="tel" placeholder="+233 24 000 0000" aria-invalid={!!errors.phone} {...register("phone")} />
            {err("phone")}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Password</Label>
            <Input id="reg-password" type="password" autoComplete="new-password" placeholder="••••••••" aria-invalid={!!errors.password} {...register("password")} />
            {(() => {
              const pw = values.password ?? "";
              if (!pw && !errors.password) {
                return <p className="text-xs text-muted-foreground">At least 10 characters, including a number.</p>;
              }
              const reqs = [
                { ok: pw.length >= 10, label: "At least 10 characters" },
                { ok: /\d/.test(pw), label: "Includes a number" },
              ];
              return (
                <ul className="space-y-0.5">
                  {reqs.map((r) => (
                    <li
                      key={r.label}
                      className={cn("flex items-center gap-1.5 text-xs transition-colors", r.ok ? "text-success" : "text-muted-foreground")}
                    >
                      {r.ok ? <Check className="size-3.5 shrink-0" aria-hidden /> : <Circle className="size-3.5 shrink-0" aria-hidden />}
                      {r.label}
                    </li>
                  ))}
                </ul>
              );
            })()}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="reg-region">{role === "buyer" ? "Where are you looking to buy?" : "Region you operate in"}</Label>
            <Select
              items={REGIONS.map((r) => ({ value: r, label: r }))}
              value={values.region || null}
              onValueChange={(v) => setValue("region", (v as string) ?? "", { shouldValidate: true })}
            >
              <SelectTrigger id="reg-region" className="w-full" aria-invalid={!!errors.region}>
                <SelectValue placeholder="Choose a region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err("region")}
          </div>

          {role === "buyer" && (
            <div className="space-y-1.5">
              <Label htmlFor="reg-budget">Budget range (₵, optional)</Label>
              <Input id="reg-budget" placeholder="e.g. 50,000 – 150,000" {...register("budget")} />
            </div>
          )}

          {role !== "buyer" && (
            <div className="space-y-1.5">
              <Label htmlFor="reg-company">{role === "seller" ? "Company / agency (optional)" : "Business name"}</Label>
              <Input id="reg-company" placeholder={role === "seller" ? "Adom Lands Ltd" : "Precision Geo Surveys"} {...register("company")} />
            </div>
          )}

          {role === "provider" && (
            <div className="space-y-1.5">
              <Label htmlFor="reg-category">Main service</Label>
              <Select
                items={CATEGORIES}
                value={values.category || null}
                onValueChange={(v) => setValue("category", (v as string) ?? "")}
              >
                <SelectTrigger id="reg-category" className="w-full">
                  <SelectValue placeholder="What do you do?" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-5">
          <dl className="space-y-2 rounded-2xl border bg-muted/30 p-5 text-sm">
            {[
              ["Role", role === "provider" ? "Service provider" : role],
              ["Name", values.name],
              ["Email", values.email],
              ["Phone", values.phone],
              ["Region", values.region],
              ...(values.company ? [["Business", values.company] as const] : []),
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted-foreground capitalize">{k}</dt>
                <dd className="font-medium capitalize">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="reg-terms"
              checked={values.terms}
              onCheckedChange={(v) => setValue("terms", !!v, { shouldValidate: true })}
              aria-invalid={!!errors.terms}
            />
            <Label htmlFor="reg-terms" className="text-sm leading-relaxed font-normal text-muted-foreground">
              I agree to the{" "}
              <Link href="/faq" className="font-medium text-primary hover:underline">
                terms of service
              </Link>{" "}
              and privacy policy.
            </Label>
          </div>
          {err("terms")}
        </div>
      )}

      <div className="mt-8 flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" size="lg" className="h-11" onClick={() => setStep((s) => s - 1)}>
            <ArrowLeft data-icon="inline-start" /> Back
          </Button>
        )}
        {step < 2 ? (
          <Button type="button" size="lg" className="h-11 flex-1" onClick={next}>
            Continue <ArrowRight data-icon="inline-end" />
          </Button>
        ) : (
          <Button type="submit" size="lg" className="h-11 flex-1" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        )}
      </div>
    </form>
  );
}
