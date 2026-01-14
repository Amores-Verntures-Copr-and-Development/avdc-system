import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./update-purchase-items";
import { PoolConnection } from "mysql2/promise";

export async function deletePurchaseOrderItems({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: Partial<PurchaseOrderItems>[];
}) {
  const updates = data.map((item) => ({
    poItemId: item.poItemId,
    poItemStatus: "removed" as PurchaseOrderItems["poItemStatus"],
  }));

  const keyFields: (keyof PurchaseOrderItems)[] = ["poItemId"];
  try {
    await updatePurchaseOrderItems({
      connection,
      updates: updates,
      keyFields: keyFields,
    });
  } catch (e) {
    throw e;
  }
}
