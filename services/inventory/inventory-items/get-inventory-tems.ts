import { selectInventoryItems } from "@/models/inventoryModels";
import { InventoryInterface } from "@/types/inventory";

export async function findInventoryItemsByField({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryItems({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}
