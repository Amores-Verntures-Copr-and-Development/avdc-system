import { getDBConnection } from "@/lib/db";
import { PurchaseOrderItems, PurchaseOrders } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./update-purchase-items";
import { selectPurchaseOrderItems } from "@/models/purchaseOrderModel";
import { updatePurchase } from "../update-purchase-order";

export async function processSentPOItems(data: PurchaseOrderItems[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    const updateItems: Partial<PurchaseOrderItems>[] =
      data.map((items) => ({
        poItemId: items.poItemId,
        poItemStatus: "sent",
      })) || [];
    await updatePurchaseOrderItems({
      connection,
      keyFields: ["poItemId"],
      updates: updateItems,
    });
    const poId = data.every((i) => i.poId === data[0].poId)
      ? data[0].poId
      : null;
    if (!poId) {
      return;
    }
    const poItems = await selectPurchaseOrderItems({ connection, poId });
    if (poItems.every((i) => i.poItemStatus === "sent")) {
      const poData: Partial<PurchaseOrders>[] = [
        {
          poId: poId,
          poStatus: "sent",
        },
      ];
      await updatePurchase({
        connection,
        keyFields: ["poId"],
        updates: poData,
      });
    }
  } catch (e) {
    console.log(e);
    throw e;
  }
}
