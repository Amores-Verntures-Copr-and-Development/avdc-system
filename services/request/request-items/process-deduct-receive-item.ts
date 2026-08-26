import { DeductReceiveDto } from "@/app/requisitions/components/DeductReceiveModal";
import { getDBConnection } from "@/lib/db";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "./update-request-items";
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
    // poItemOrderedQty (what was ordered on the PO) is never touched by a
    // request-item receive/deduct adjustment - only the request item and
    // inventory quantities change here.
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
    console.log(e);
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
