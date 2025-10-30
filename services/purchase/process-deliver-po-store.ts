import { DeliverItemsToStore } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { Request, RequestItems } from "@/types/request";
import { updateRequestItems } from "../request/request-items/update-request-items";
import {
  findRequestOrderItemById,
  getRequestOrderItems,
} from "../request/request-items/get-request-items";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { updatePurchaseOrderItems } from "./purchase-items/update-purchase-items";
import { updateRequests } from "../request/update-request";
import { getPurchaseOrderItemById } from "@/controllers/PurchaseOrderController";
import { findPOItemsById } from "../purchaseOrderServices";
import { updatePurchase } from "./update-purchase-order";

export async function processDeliverItemToStore(data: DeliverItemsToStore) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //Get requestItems from poId and storeId
    const requestItemData: Partial<RequestItems>[] = await Promise.all(
      data.items.map(async (item) => {
        // Example DB call — replace with your actual query or function
        const reqItem = await findRequestOrderItemById({
          requestId: data.requestId,
          itemId: item.itemId,
        });

        return {
          reqItemId: reqItem[0].reqItemId,
          reqItemStatus: "delivered",
        };
      })
    );
    await updateRequestItems({
      connection,
      updates: requestItemData,
      keyFields: ["reqItemId"],
    });
    //Plug Request Items to delivered status
    const poItemsData: Partial<PurchaseOrderItems>[] =
      data.items?.map((item) => ({
        poItemId: item.poItemId,
        poItemStatus: "delivered",
      })) || [];
    await updatePurchaseOrderItems({
      connection,
      keyFields: ["poItemId"],
      updates: poItemsData,
    });
    const requestItems = await getRequestOrderItems({
      requestId: data.requestId,
      connection,
    });
    const isAllDelivered = requestItems.every(
      (item) => item.reqItemStatus === "delivered"
    );
    const purchaseItems = await findPOItemsById({
      connection,
      poId: data.poId,
    });
    const isAllPOitemsDelivered = purchaseItems.every(
      (item) => item.poItemStatus === "delivered"
    );
    if (isAllPOitemsDelivered) {
      await updatePurchase({
        connection,
        keyFields: ["poId"],
        updates: [
          {
            poId: data.poId,
            poStatus: "received",
          },
        ],
      });
    }
    if (isAllDelivered) {
      const request: Partial<Request>[] = [
        {
          requestId: data.requestId,
          requestStatus: "delivered",
        },
      ];
      await updateRequests({
        connection,
        keyFields: ["requestId"],
        updates: request,
      });
    }
    //Plu the Purchase Order Items to delivered status
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
