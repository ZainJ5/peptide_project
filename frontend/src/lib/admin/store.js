"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Admin panel session. Kept apart from the site-user auth store and held in
 * sessionStorage, so closing the tab ends the admin session.
 */
export const useAdminStore = create(
  persist(
    (set) => ({
      token: "",
      expiresAt: 0,
      admin: null,
      hydrated: false,
      setSession: ({ token, expiresAt, admin }) => set({ token, expiresAt: expiresAt || 0, admin }),
      setAdmin: (admin) => set({ admin }),
      clearSession: () => set({ token: "", expiresAt: 0, admin: null }),
      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "mpd-admin-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ token, expiresAt, admin }) => ({ token, expiresAt, admin }),
      // Storage is synchronous, so this can run while create() is still executing;
      // use the state's own setter rather than referencing useAdminStore.
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    }
  )
);

export function isSessionValid({ token, expiresAt }) {
  return Boolean(token) && (!expiresAt || expiresAt > Date.now());
}

/** Post-login destination from ?next=, restricted to admin pages. */
export function adminNextPath() {
  if (typeof window === "undefined") return "/admin";
  const next = new URLSearchParams(window.location.search).get("next") || "";
  return next.startsWith("/admin") && !next.startsWith("/admin/login") && !next.includes("//") ? next : "/admin";
}
