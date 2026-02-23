import { useEffect } from "react";

export function useInventoryItems({
  reference,
  search,
  id,
}: {
  id: number;
  reference: "storeId" | "inventoryId";
  search: string;
}) {
  let baseUrl =
    reference === "storeId"
      ? `api/inventory/store/${id}/items`
      : reference === "inventoryId"
        ? `api/inventory/store/${id}`
        : null;

  useEffect(() => {
    if (search) {
      baseUrl = `${baseUrl}?search=${search}`;
    }
  }, [search]);
  return;
}
