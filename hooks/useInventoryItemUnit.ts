import { ApiResponse } from "@/types/api";
import { CategoryInterface } from "@/types/categories";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import useSWR from "swr";

export function useInventoryItemUnit({
  inventoryId,
  reference,
}: {
  inventoryId: number;
  reference: "stock-room" | "stores" | "inventoryId";
}) {
  const localStorageKey = `unit${inventoryId}_inventory`;
  const baseApi =
    reference === "inventoryId"
      ? `/api/inventory/item/${inventoryId}/unit`
      : null;
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<{ itemUnit: string }[]>
  >(
    inventoryId ? baseApi : null,
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
        throw new Error(`Failed to fetch category: ${res.status}`);
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
    },
  );

  const unitOptions = data?.data
    .map((item) => item.itemUnit)
    .filter((itemUnit, index, array) => array.indexOf(itemUnit) === index)
    .map((itemUnit) => ({
      label: itemUnit,
      value: itemUnit,
    }));

  return {
    unitOptions: unitOptions,
    units: data?.data[0],
    error,
    isLoading,
    mutate,
  };
}
