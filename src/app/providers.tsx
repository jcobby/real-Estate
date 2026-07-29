"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ApiError, describeError, SESSION_EXPIRED_EVENT } from "@/lib/api/http";
import { useSession } from "@/stores/session";

/** An expired/invalid session: sign out cleanly and send the user to log in. */
let sessionExpiring = false;
function onSessionExpired() {
  if (sessionExpiring || typeof window === "undefined") return;
  if (window.location.pathname.startsWith("/login")) return;
  sessionExpiring = true;
  useSession.getState().signOut();
  toast.error("Your session expired", { id: "session-expired", description: "Please sign in again." });
  const next = window.location.pathname + window.location.search;
  window.location.href = `/login?next=${encodeURIComponent(next)}`;
}
const isSessionExpired = (error: unknown) => error instanceof ApiError && error.code === "SESSION_EXPIRED";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // Surface failures instead of leaving screens stuck loading. A shared
        // toast id collapses repeated background-poll failures into one message.
        queryCache: new QueryCache({
          onError: (error) => {
            if (isSessionExpired(error)) return onSessionExpired();
            toast.error("Couldn't load this", { id: "load-error", description: describeError(error) });
          },
        }),
        mutationCache: new MutationCache({
          // Skip if the component already handles its own onError (no double toast).
          onError: (error, _vars, _ctx, mutation) => {
            if (isSessionExpired(error)) return onSessionExpired();
            if (mutation.options.onError) return;
            toast.error("That didn't work", { description: describeError(error) });
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 20_000,
            // never retry an expired/invalid session — surface it immediately
            retry: (count, error) =>
              !(error instanceof ApiError && (error.code === "SESSION_EXPIRED" || error.status === 401)) && count < 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useEffect(() => {
    const handler = () => onSessionExpired();
    window.addEventListener(SESSION_EXPIRED_EVENT, handler);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler);
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
