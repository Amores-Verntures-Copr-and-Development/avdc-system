import { AdditionalReceiveDto } from "@/app/requisitions/components/AdditionalReceiveModal";
import { getDBConnection } from "@/lib/db";
import { RequestItems } from "@/types/request";
import { updateRequestItems } from "./update-request-items";
import { findInventoryItemsByField } from "@/services/inventory/inventory-items/get-inventory-items";
import { InventoryItemInterface } from "@/types/inventory";
import { updateInventoryItem } from "@/services/inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { createInventoryMovement } from "@/services/inventory/inventory-movement/create-inventory-movement";
import { findPurchaserOrderItemByReqItemId } from "@/services/purchase/purchase-items/get-purchase-tems";
import { findRequestItemsByPoItemIdWithConverions } from "./get-request-items";
import { updatePurchaseOrderItems } from "@/services/purchase/purchase-items/update-purchase-items";

export async function processAdditionalReceiveRequestItem(
  data: AdditionalReceiveDto,
) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  let checkRequestItems: any = [];
  await connection.beginTransaction();
  try {
    await connection.beginTransaction();
    const requestItemUpdate: Partial<RequestItems> = {
      reqItemId: data.requestItems.reqItemId,
      invItem: data.requestItems.invItem,
      reqItemTransfer:
        Number(data.requestItems.reqItemTransfer) +
        Number(data.additionalReceive),
      reqItemReceived:
        Number(data.requestItems.reqItemReceived) +
        Number(data.additionalReceive),
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

    if (poItems.length > 0) {
      checkRequestItems = await findRequestItemsByPoItemIdWithConverions({
        connection,
        poItemId: poItems[0].poItemId,
      });
    }
    const sumOfOrderReceived = checkRequestItems.reduce(
      (sumItems: number, i: any) => {
        return sumItems + Number(i.reqItemReceived);
      },
      0,
    );
    const requestItemsIsAllDelivered = Boolean(
      checkRequestItems.length &&
      checkRequestItems.every((req: any) =>
        ["received", "complete"].includes(req.reqItemStatus),
      ),
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
    const createaddInventoryItems: Partial<InventoryItemInterface> = {
      inventoryId: inventoryItem.data[0].inventoryId,
      inventoryItemId: requestItemUpdate.invItem,
      inventoryItemQuantity: Number(data.additionalReceive),
    };
    await updateInventoryItem({
      connection: connection,
      updates: [createaddInventoryItems],
      keyFields: ["inventoryItemId"],
      fieldModes: { inventoryItemQuantity: "increment" },
    });
    const createInventoryItemMovement: CreateInventoryMovementDto = {
      inventoryId: inventoryItem.data[0].inventoryId,
      inventoryItemId: inventoryItem.data[0].inventoryItemId,
      itemMovementQuantity: Number(
        createaddInventoryItems.inventoryItemQuantity,
      ),
      itemMovementReference: "ro",
      itemMovementReferenceId: data.requestItems.requestId!,
      itemMovementType: "in",
      itemMovementRemarks: "additional received",
    };
    await createInventoryMovement({
      connection: connection,
      data: [createInventoryItemMovement],
    });

    await connection.commit();
  } catch (e) {
    console.log(e);
    await connection.rollback();
  } finally {
    connection.release();
  }
}
