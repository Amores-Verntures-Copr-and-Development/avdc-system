import { ApiResponse } from "@/types/api";
import { CategoryInterface } from "@/types/categories";
import { StockRoom } from "@/types/stockRoom";
import { StoreInterface } from "@/types/stores";
import useSWR from "swr";

export function useCategories({
  inventoryId,
  reference,
}: {
  inventoryId: number;
  reference?: "stock-room" | "stores" | "inventoryId";
}) {
  const localStorageKey = `category_${inventoryId}_inventory`;
  const baseApi =
    reference === "inventoryId"
      ? `api/categories/inventory/${inventoryId}`
      : null;
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<CategoryInterface[]>
  >(
    inventoryId ? baseApi : null,
    async (url) => {
      // Check localStorage first
      // const stored = localStorage.getItem(localStorageKey);
      // console.log(
      //   { stored },
      //   "Checking localStorage for key:",
      //   localStorageKey,
      // );
      // if (stored) {
      //   const storedData = JSON.parse(stored);

      //   return storedData;
      // }

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

  const categoryOptions = data?.data
    .map((item) => item.categoryName)
    .filter(
      (categoryName, index, array) => array.indexOf(categoryName) === index,
    )
    .map((categoryName) => ({
      label: categoryName,
      value: categoryName,
    }));

  return {
    categoryOptions: categoryOptions,
    categories: data?.data,
    error,
    isLoading,
    mutate,
  };
}
