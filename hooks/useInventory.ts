import useSWR from "swr";
import { fetcher } from "@/utils/fetcher";
import { StockRoom } from "@/types/stockRoom";
import { DisplayAllInventory } from "@/app/inventory/InventoryPage";

export function useUserInventory(user: any, hasStore: boolean) {
  const shouldFetch = !!user;

  // Fetch stock room only if user has no store
  const stockRoomKey =
    shouldFetch && !hasStore ? `/api/stock-room/userId/${user.userId}` : null;

  const {
    data: stockRoomResponse,
    isLoading: stockRoomLoading,
    error: stockRoomError,
  } = useSWR<{ data: StockRoom[] }>(stockRoomKey, fetcher);

  const stockRoomId = stockRoomResponse?.data?.[0]?.stockRoomId ?? null;

  // Build inventory URL
  const inventoryKey = !shouldFetch
    ? null
    : hasStore
      ? `/api/inventory/store/${user.storeId}`
      : stockRoomId
        ? `/api/inventory/stock-room/${user.userId}`
        : `/api/inventory`;

  const {
    data: inventoryResponse,
    isLoading: inventoryLoading,
    error: inventoryError,
    mutate,
  } = useSWR<{ data: DisplayAllInventory[] }>(inventoryKey, fetcher);

  return {
    inventory: inventoryResponse?.data ?? [],
    inventoryLoading: stockRoomLoading || inventoryLoading,
    stockRoomId,
    mutate,
    error: stockRoomError || inventoryError,
  };
}
