import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { updateRequestItems } from "../request/request-items/update-request-items";
import { Request, RequestItems } from "@/types/request";
import { updateRequests } from "./update-request";
import { InventoryItemInterface } from "@/types/inventory";
import { findIventoryByFields } from "../inventory/get-inventory";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryItemsByField } from "../inventory/inventory-items/get-inventory-items";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";

export async function processDeliveredPO(data: Request[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const request: Partial<Request>[] = data.map((req) => ({
      requestId: req.requestId,
      requestStatus: "delivered",
    }));
    await updateRequests({
      connection,
      keyFields: ["requestId"],
      updates: request,
    });
    const requestItemData: Partial<RequestItems>[] = data.flatMap((req) =>
      req.requestItems.flatMap((item) => ({
        reqItemId: item.reqItemId,
        reqItemTransfer: item.reqItemTransfer,
        reqItemStatus: "delivered",
      }))
    );
    await updateRequestItems({
      connection,
      updates: requestItemData,
      keyFields: ["reqItemId"],
    });
    const warehouseInv = await findIventoryByFields({
      keyFields: { storeId: null },
    });
    const decerementInv: Partial<InventoryItemInterface>[] = data.flatMap(
      (req) =>
        req.requestItems.flatMap((item) => ({
          inventoryId: warehouseInv[0].inventoryId,
          inventoryItemReferenceId: item.itemId,
          inventoryItemQuantity: item.reqItemTransfer,
        }))
    );
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "decrement" },
      updates: decerementInv,
      keyFields: ["inventoryItemReferenceId", "inventoryId"],
    });
    const storeInventoryMovement: CreateInventoryMovementDto[] =
      await Promise.all(
        data.flatMap((data) =>
          data.requestItems.flatMap(async (req) => {
            const inventoryItem = await findInventoryItemsByField({
              keyFields: {
                inventoryId: warehouseInv[0].inventoryId ?? 0,
                inventoryItemReferenceId: req.itemId,
              },
            });
            return {
              inventoryId: warehouseInv[0].inventoryId,
              inventoryItemId: inventoryItem[0].inventoryItemId, // fallback if not found
              itemMovementType: "out",
              itemMovementReferenceId: req.requestId ?? 0,
              itemMovementReference: "ro",
              itemMovementQuantity: Number(req.reqItemTransfer),
              itemMovementRemarks: "Deliver item to store",
            };
          })
        )
      );
    console.log("[createInventoryMovementDeliver]");
    await createInventoryMovement({ connection, data: storeInventoryMovement });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
