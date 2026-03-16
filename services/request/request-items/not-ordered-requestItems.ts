import { getDBConnection } from "@/lib/db";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "./update-request-items";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { findPurchaserOrderItemByReqItemId } from "@/services/purchase/purchase-items/get-purchase-tems";
import { findRequestItemsByPOItemId } from "./get-request-items";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";

export async function notOrderedRequestItems({
  requestItems,
}: {
  requestItems: Partial<RequestItems>[];
}) {
  let updatePoItems: Partial<PurchaseOrderItems>[] = [];
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const updateRequestNotOrdered: Partial<RequestItems>[] = requestItems.map(
      (i) => ({
        reqItemId: i.reqItemId,
        reqItemStatus: "not_ordered",
      }),
    );
    await updateRequestItems({
      connection: connection,
      updates: updateRequestNotOrdered,
      keyFields: ["reqItemId"],
    });
    for (const reqItem of updateRequestNotOrdered) {
      if (!reqItem.reqItemId) continue;

      const poItems = await findPurchaserOrderItemByReqItemId({
        connection: connection,
        reqItemId: reqItem.reqItemId,
      });
      if (!poItems || poItems.length === 0) continue;

      const checkRequestItems = await findRequestItemsByPOItemId({
        connection: connection,
        poItemId: [poItems[0].poItemId],
      });

      const allRequestItemsNotOrdered = checkRequestItems.every(
        (r) => r.reqItemStatus === "not_ordered",
      );

      if (allRequestItemsNotOrdered) {
        updatePoItems.push({ poItemId: poItems[0].poItemId });
      }
    }
    if (updatePoItems && updatePoItems.length > 0) {
      const updatePoItemsDeliveredToStore: Partial<PurchaseOrderItems>[] =
        updatePoItems.map((i) => ({
          poItemId: i.poItemId,
          poItemStatus: "not_ordered",
        }));
      await updatePurchaseOrderItems({
        connection,
        updates: updatePoItemsDeliveredToStore,
        keyFields: ["poItemId"],
      });
    }
    await connection.commit();
    return updatePoItems;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
