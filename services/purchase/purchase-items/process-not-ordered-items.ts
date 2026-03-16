import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./update-purchase-items";
import { findPurchaserOrder } from "./get-purchase-tems";
import { getDBConnection } from "@/lib/db";
import { updatePurchase } from "../update-purchase-order";

export async function processNotOrderedItems(data: PurchaseOrderItems[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  await connection.beginTransaction();
  try {
    const notOrdedItems: Partial<PurchaseOrderItems>[] = data.map((item) => ({
      poItemId: item.poItemId,
      poItemStatus: "not_ordered",
    }));
    if (notOrdedItems.length === 0) {
      throw new Error("No data found to mark as not ordered!");
    }

    await updatePurchaseOrderItems({
      connection,
      keyFields: ["poItemId"],
      updates: notOrdedItems,
    });
    const poId = data.every((item) => item.poId === data[0].poId)
      ? data[0].poId
      : null;
    if (poId) {
      const poItems = await findPurchaserOrder({
        connection,
        keyfields: { poId },
      });
      const validForUpdateReceived = poItems
        .filter(
          (poi) =>
            poi.poItemStatus !== "not_ordered" &&
            poi.poItemStatus !== "removed",
        )
        .every((item) => item.poItemStatus === "received");
      const validForNotOrdered = poItems
        .filter((poi) => poi.poItemStatus !== "removed")
        .every((item) => item.poItemStatus !== "not_ordered");

      if (validForUpdateReceived) {
        await updatePurchase({
          connection,
          updates: [{ poId: poId, poStatus: "received" }],
          keyFields: ["poId"],
        });
      } else if (validForNotOrdered) {
        await updatePurchase({
          connection,
          updates: [{ poId: poId, poStatus: "not_ordered" }],
          keyFields: ["poId"],
        });
      }
    }
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
