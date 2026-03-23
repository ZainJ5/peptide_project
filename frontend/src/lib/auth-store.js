"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set) => ({
      token: "",
      refreshToken: "",
      user: null,
      setAuth: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
      clearAuth: () => set({ token: "", refreshToken: "", user: null }),
    }),
    {
      name: "peptide-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    }
  )
);
