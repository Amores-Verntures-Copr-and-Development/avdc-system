import { getDBConnection } from "@/lib/db";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "./update-request-items";
import { findPurchaserOrderItemByReqItemId } from "@/services/purchase/purchase-items/get-purchase-tems";
import { findRequestItemsByPOItemId } from "./get-request-items";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";
import { InventoryItemInterface } from "@/types/inventory";
import { updateInventoryItem } from "@/services/inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-items";
import { createInventoryItems } from "@/services/inventory/inventory-items/create-inventory-items";
import { createInventoryMovement } from "@/services/inventory/inventory-movement/create-inventory-movement";

export const receiveRequestItems = async ({
  requestItems,
}: {
  requestItems: Partial<RequestItems>[];
}) => {
  let updatePoItems: Partial<PurchaseOrderItems>[] = [];
  let addInventoryItems: Partial<InventoryItemInterface>[] = [];
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    //Update the Request Item Received
    const updateReceivedRequestItems: Partial<RequestItems>[] =
      requestItems.map((i) => ({
        reqItemId: i.reqItemId,
        reqItemStatus: "received",
        reqItemReceived: i.reqItemReceived,
        reqItemTransfer: i.reqItemReceived,
        invItem: i.invItem,
      }));
    await updateRequestItems({
      connection: connection,
      updates: updateReceivedRequestItems,
      keyFields: ["reqItemId", "invItem"],
    });
    for (const reqItem of updateReceivedRequestItems) {
      if (!reqItem.reqItemId) continue;
      const poItems = await findPurchaserOrderItemByReqItemId({
        connection: connection,
        reqItemId: reqItem.reqItemId,
      });
      addInventoryItems.push({
        inventoryItemId: reqItem.invItem,
        inventoryItemQuantity: reqItem.reqItemReceived,
      });
      console.log({ poItems });
      if (poItems && poItems.length) {
        const checkRequestItems = await findRequestItemsByPOItemId({
          connection: connection,
          poItemId: [poItems[0].poItemId],
        });

        const isAllRequestDeliveredOrReceived =
          checkRequestItems &&
          checkRequestItems.every(
            (i) =>
              i.reqItemStatus === "delivered" || i.reqItemStatus === "received",
          );

        if (isAllRequestDeliveredOrReceived) {
          const updatePoItem: Partial<PurchaseOrderItems> = {
            poItemId: poItems[0].poItemId,
            poItemStatus: "received_store",
          };
          updatePoItems.push(updatePoItem);
        }
      }
    }
    if (addInventoryItems && addInventoryItems.length) {
      let createInventoryItemMovement: CreateInventoryMovementDto[] = [];
      await updateInventoryItem({
        connection: connection,
        updates: addInventoryItems,
        keyFields: ["inventoryItemId"],
        fieldModes: { inventoryItemQuantity: "increment" },
      });
      for (const i of addInventoryItems) {
        const inventoryItem = await findInventoryItemsByField({
          connection: connection,
          keyFields: { inventoryItemId: i.inventoryItemId },
        });
        if (inventoryItem) {
          createInventoryItemMovement.push({
            inventoryId: inventoryItem.data[0].inventoryId,
            inventoryItemId: inventoryItem.data[0].inventoryItemId,
            itemMovementQuantity: i.inventoryItemQuantity!,
            itemMovementReference: "ro",
            itemMovementReferenceId: requestItems[0].requestId!,
            itemMovementType: "in",
            itemMovementRemarks: "",
          });
        }
      }

      if (createInventoryItemMovement && createInventoryItemMovement.length) {
        await createInventoryMovement({
          connection: connection,
          data: createInventoryItemMovement,
        });
      }
    }
    if (updatePoItems && updatePoItems.length > 0) {
      await updatePurchaseOrderItems({
        connection,
        updates: updatePoItems,
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
};
