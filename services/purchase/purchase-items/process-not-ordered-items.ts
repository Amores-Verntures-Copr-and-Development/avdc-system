import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./update-purchase-items";

export async function processNotOrderedItems(data: PurchaseOrderItems[]) {
  try {
    const notOrdedItems: Partial<PurchaseOrderItems>[] = data.map((item) => ({
      poItemId: item.poItemId,
      poItemStatus: "not_ordered",
    }));
    if (notOrdedItems.length === 0) {
      throw new Error("No data found to mark as not ordered!");
    }
    console.log({ notOrdedItems });
    await updatePurchaseOrderItems({
      keyFields: ["poItemId"],
      updates: notOrdedItems,
    });
  } catch (e) {
    throw e;
  }
}
