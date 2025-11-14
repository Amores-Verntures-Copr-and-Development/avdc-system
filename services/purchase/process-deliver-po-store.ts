import { DeliverItemsToStore } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { Request, RequestItems } from "@/types/request";
import { updateRequestItems } from "../request/request-items/update-request-items";
import {
  findRequestItemsByPOItemId,
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
    console.log("DeliverItemsToStore: ", { data });
    //Get requestItems from poId and storeId
    // const requestItemData: Partial<RequestItems>[] = await Promise.all(
    //   data.items.map(async (item) => {
    //     // Example DB call — replace with your actual query or function
    //     const reqItem = await findRequestOrderItemById({
    //       requestId: data.requestId,
    //       itemId: item.itemId,
    //     });

    //     return {
    //       reqItemId: reqItem[0].reqItemId,
    //       reqItemStatus: "delivered",
    //     };
    //   })
    // );
    const requestItemData: Partial<RequestItems>[] = data.items.map((item) => ({
      reqItemId: item.reqItemId,
      reqItemStatus: "delivered",
    }));
    console.log("requestItemData: ", { requestItemData });
    await updateRequestItems({
      connection,
      updates: requestItemData,
      keyFields: ["reqItemId"],
    });

    const requestItemsInPOItem = await findRequestItemsByPOItemId({
      connection,
      poItemId: data.poItems
        ? data.poItems
            .map((item) => item.poItemId)
            .filter((id): id is number => id !== undefined)
        : [],
    });

    // Get unique poItemIds that have delivered status
    const poItemGroups = requestItemsInPOItem.reduce((acc, reqItem) => {
      const poItemId = reqItem.poItemId;
      if (!acc[poItemId]) {
        acc[poItemId] = [];
      }
      acc[poItemId].push(reqItem);
      return acc;
    }, {} as Record<number, typeof requestItemsInPOItem>);

    const fullyDeliveredPoItemIds = Object.entries(poItemGroups)
      .filter(([poItemId, items]) =>
        items.every((item) => item.reqItemStatus === "delivered")
      )
      .map(([poItemId]) => parseInt(poItemId));

    console.log({ fullyDeliveredPoItemIds });
    if (fullyDeliveredPoItemIds.length > 0) {
      const poItemsData: Partial<PurchaseOrderItems>[] =
        fullyDeliveredPoItemIds.map((item) => ({
          poItemId: item,
          poItemStatus: "delivered",
        })) || [];
      await updatePurchaseOrderItems({
        connection,
        keyFields: ["poItemId"],
        updates: poItemsData,
      });
    }
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
