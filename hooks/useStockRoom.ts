import { ApiResponse } from "@/types/api";
import { StockRoom } from "@/types/stockRoom";
import useSWR from "swr";

export function useStockRoom(userId: number | null) {
  const localStorageKey = `user_${userId}_stockRoom`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<StockRoom[]>>(
    userId ? `/api/stock-room/userId/${userId}` : null,
    async (url) => {
      // Check localStorage first
      const stored = localStorage.getItem(localStorageKey);
      if (stored) {
        const storedData = JSON.parse(stored);
        console.log("Using cached stock room data");
        return storedData;
      }

      // Fetch from API if not in localStorage
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) {
        return null;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch stock room: ${res.status}`);
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
    stockRoom: data?.data[0],
    error,
    isLoading,
    mutate,
  };
}
