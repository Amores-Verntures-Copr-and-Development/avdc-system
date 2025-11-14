"use client";
import useSWR from "swr";
import { useMemo } from "react";
import { EmployeePosition } from "@/types/employees";
import { UserRole } from "@/types/users";

export type UserAuth = {
  userId: number;
  userRole: UserRole;
  userFullName: string;
  empPosition: EmployeePosition;
  storeId: number | null;
};

export function useSession() {
  const { data, error, isLoading, mutate } = useSWR<{ user: UserAuth | null }>(
    "/api/auth/users",
    async (url) => {
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) {
        // ✅ cleanly return no user instead of throwing
        return { user: null };
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch session: ${res.status}`);
      }

      return res.json();
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // avoid spamming server
      errorRetryInterval: 5000,
      shouldRetryOnError: (err) => {
        // Don’t retry on unauthorized
        return !(err instanceof Error && err.message.includes("401"));
      },
    }
  );

  const initialLoading = !data && !error;

  const sessionValue = useMemo(
    () => ({
      user: data?.user ?? null,
      loading: initialLoading || isLoading,
      error: error ?? null,
      refreshSession: mutate,
      isAuthenticated: !!data?.user,
      isAdmin: data?.user?.userRole === "superadmin",
      hasStore:
        data?.user?.userRole === "employee" &&
        (data?.user?.empPosition === "staff" ||
          data?.user?.empPosition === "supervisor"),
    }),
    [data, isLoading, error, mutate, initialLoading]
  );

  return sessionValue;
}
