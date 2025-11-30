import { DeliverItemsToStore } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { Request, RequestItems } from "@/types/request";
import { updateRequestItems } from "../request/request-items/update-request-items";
import {
  findRequestItemsByPOId,
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
import { findStoreItemsBySupplierAndPOIds } from "./purchase-items/get-purchase-tems";
import { StoreSupplierDetails } from "@/app/purchase-orders/components/ApprovedPOView";

export async function processDeliverItemToStore(data: DeliverItemsToStore) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const requestItemData: Partial<RequestItems>[] = data.items.map((item) => ({
      reqItemId: item.reqItemId,
      reqItemStatus: "delivered",
    }));

    await updateRequestItems({
      connection,
      updates: requestItemData,
      keyFields: ["reqItemId"],
    });

    const allSameSupplier = data.items.every(
      (i) => i.suppId === data.items[0].suppId
    );
    const suppId = allSameSupplier ? data.items[0].suppId : null;

    const requestItems = await getRequestOrderItems({
      requestId: data.requestId,
      connection,
    });
    const isAllDelivered = requestItems.every(
      (item) => item.reqItemStatus === "delivered"
    );
    const allRequestItems = requestItems.map((item) => ({
      reqitemId: item.reqItemId,
      reqItemStatus: item.reqItemStatus,
    }));

    console.log("Request Items: ", allRequestItems);
    console.log({ isAllDelivered });
    console.log({ allSameSupplier, suppId });
    if (allSameSupplier && suppId) {
      const storeSuppPoId: StoreSupplierDetails[] =
        await findStoreItemsBySupplierAndPOIds({
          connection,
          poId: data.poId,
          suppId: suppId,
        });

      const allRequestItemsWithSameSupplierDelivered = storeSuppPoId.every(
        (i) => i.items.every((items) => items.reqItemStatus === "delivered")
      );

      if (allRequestItemsWithSameSupplierDelivered) {
        await updatePurchaseOrderItems({
          connection,
          updates: storeSuppPoId.flatMap((s) =>
            s.items.flatMap((i) => ({
              poItemId: i.poItemId,
              poItemStatus: "delivered",
            }))
          ),
        });
      }
    } //Plu the Purchase Order Items to delivered status
    const purchaseItems = await findPOItemsById({
      connection,
      poId: data.poId,
    });
    const isAllPOitemsDelivered = purchaseItems.every(
      (item) => item.poItemStatus === "delivered"
    );
    // console.log({ purchaseItems, isAllPOitemsDelivered });
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
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
