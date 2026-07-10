import { DeductReceiveDto } from "@/app/requisitions/components/DeductReceiveModal";
import { getDBConnection } from "@/lib/db";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "./update-request-items";
import { findPurchaserOrderItemByReqItemId } from "@/services/purchase/purchase-items/get-purchase-tems";
import { findRequestItemsByPoItemIdWithConverions } from "./get-request-items";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { updateInventoryItem } from "@/services/inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { createInventoryMovement } from "@/services/inventory/inventory-movement/create-inventory-movement";

export async function processDeductReceiveItem(data: DeductReceiveDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    if (Number(data.requestItems.reqItemReceived) < data.deductReceive) {
      throw new Error(
        "Quantity to be deduct is greater than current received item!",
      );
    }

    const requestItemUpdate: Partial<RequestItems> = {
      reqItemId: data.requestItems.reqItemId,
      invItem: data.requestItems.invItem,
      reqItemTransfer:
        Number(data.requestItems.reqItemTransfer) - Number(data.deductReceive),
      reqItemReceived:
        Number(data.requestItems.reqItemReceived) - Number(data.deductReceive),
    };
    await updateRequestItems({
      keyFields: ["reqItemId", "invItem"],
      updates: [requestItemUpdate],
      connection: connection,
    });
    const poItems = await findPurchaserOrderItemByReqItemId({
      connection,
      reqItemId: requestItemUpdate.reqItemId!,
    });

    const checkRequestItems = await findRequestItemsByPoItemIdWithConverions({
      connection,
      poItemId: poItems[0].poItemId,
    });
    const sumOfOrderReceived = checkRequestItems.reduce((sumItems, i) => {
      return sumItems + Number(i.reqItemReceived);
    }, 0);
    const requestItemsIsAllDelivered = checkRequestItems.every((req) =>
      ["received", "complete"].includes(req.reqItemStatus),
    );
    if (requestItemsIsAllDelivered) {
      await updatePurchaseOrderItems({
        connection,
        updates: [
          {
            poItemId: poItems[0].poItemId,
            poItemOrderedQty: Number(sumOfOrderReceived),
          },
        ],
        keyFields: ["poItemId"],
      });
    }
    const inventoryItem = await findInventoryItemsByField({
      connection: connection,
      keyFields: { inventoryItemId: requestItemUpdate.invItem },
    });
    if (inventoryItem.data.length === 0) {
      throw new Error("No inventory found!");
    }
    const createDeductInventoryItems: Partial<InventoryItemInterface> = {
      inventoryId: inventoryItem.data[0].inventoryId,
      inventoryItemId: requestItemUpdate.invItem,
      inventoryItemQuantity: Number(data.deductReceive),
    };
    await updateInventoryItem({
      connection: connection,
      updates: [createDeductInventoryItems],
      keyFields: ["inventoryItemId"],
      fieldModes: { inventoryItemQuantity: "decrement" },
    });
    const createInventoryItemMovement: CreateInventoryMovementDto = {
      inventoryId: inventoryItem.data[0].inventoryId,
      inventoryItemId: inventoryItem.data[0].inventoryItemId,
      itemMovementQuantity: Number(
        createDeductInventoryItems.inventoryItemQuantity,
      ),
      itemMovementReference: "ro",
      itemMovementReferenceId: data.requestItems.requestId!,
      itemMovementType: "out",
      itemMovementRemarks: "deduct from request order received",
    };
    await createInventoryMovement({
      connection: connection,
      data: [createInventoryItemMovement],
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
