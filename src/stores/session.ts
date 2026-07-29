"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, Session } from "@/types";

interface SessionState {
  session: Session | null;
  /** true once the persisted state has been rehydrated on the client */
  hydrated: boolean;
  setSession: (session: Session | null) => void;
  setHydrated: () => void;
  signOut: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      hydrated: false,
      setSession: (session) => set({ session }),
      setHydrated: () => set({ hydrated: true }),
      signOut: () => set({ session: null }),
    }),
    {
      name: "realestate:session",
      // only the session itself is persisted — never the transient hydration flag
      partialize: (state) => ({ session: state.session }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

export const roleHome: Record<Role, string> = {
  buyer: "/dashboard",
  seller: "/seller",
  provider: "/dashboard",
  admin: "/admin",
};
