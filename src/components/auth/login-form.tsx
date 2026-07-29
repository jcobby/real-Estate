"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/lib/api";
import { describeError } from "@/lib/api/http";
import { loginRequestSchema } from "@/lib/api/validation.generated";
import { useSession, roleHome } from "@/stores/session";

// Generated from the backend OpenAPI so the rules can never drift out of sync.
const schema = loginRequestSchema;

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setSession = useSession((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    try {
      const session = await login(values.email, values.password);
      setSession(session);
      toast.success(`Welcome back, ${session.user.name.split(" ")[0]}!`);
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/") ? next : roleHome[session.user.role]);
    } catch (e) {
      toast.error("Couldn't sign in", { description: describeError(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="kwame.mensah@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">Password</Label>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:underline"
            onClick={() => toast("Password reset isn't set up yet", { description: "If you can't sign in, create a new account." })}
          >
            Forgot password?
          </button>
        </div>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          aria-invalid={!!errors.password}
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
        {isSubmitting && <LoaderCircle data-icon="inline-start" className="animate-spin" />}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to RealEstate?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Create an account
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        New here? <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link> in under a minute.
      </p>
    </form>
  );
}
