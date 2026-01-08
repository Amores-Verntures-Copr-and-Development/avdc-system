import { ApiResponse } from "@/types/api";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import useSWR from "swr";
import { UserAuth } from "./useSession";

export function useStores({
  user,
  hasStore,
  isAdmin,
}: {
  user?: UserAuth | null;
  hasStore: boolean;
  isAdmin: boolean;
}) {
  if (!user) {
    return {
      stores: null,
      error: null,
      isLoading: false,
      mutate: async () => {},
    };
  }
  const localStorageKey = `user_${user.userId}_stores`;
  const apiUrl =
    !hasStore || isAdmin ? `/api/stores` : `/api/stores/userId/${user.userId}`;
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<StoreInterface[]>
  >(
    user ? apiUrl : null,
    async (url) => {
      // Check localStorage first
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const storedData = JSON.parse(stored);
  
        return storedData;
      }

      // Fetch from API if not in localStorage
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch stores: ${res.status}`);
      }

      const responseData = await res.json();

      // Store in localStorage
      if (responseData) {
        localStorage.setItem(localStorageKey, JSON.stringify(responseData));
      }

      return responseData;
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryInterval: 5000,
      shouldRetryOnError: (err) => {
        return !(err instanceof Error && err.message.includes("401"));
      },
    }
  );

  return {
    stores: !hasStore || isAdmin ? data?.data : data?.data[0],
    error,
    isLoading,
    mutate,
  };
}
