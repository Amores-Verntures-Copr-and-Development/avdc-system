import { selectInventoryMovementItems } from "@/models/inventoryModels";
import { InventoryItemInterface } from "@/types/inventory";

export async function getInventoryMovement({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryItemInterface>; // dynamic filters like {inventoryId: 1, storeId: null}
}) {
  try {
    const data = await selectInventoryMovementItems({
      keyFields,
    });
    return data;
  } catch (e) {
    console.log(e);
    throw e;
  }
}
