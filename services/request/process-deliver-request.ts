import { UpdatePurchaseOrdersDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { updateRequestItems } from "../request/request-items/update-request-items";
import { Request, RequestItems } from "@/types/request";
import { updateRequests } from "./update-request";
import { InventoryItemInterface } from "@/types/inventory";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryItemsByField } from "../inventory/inventory-items/get-inventory-items";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { findStockRoomBySPFields } from "../stock-room/get-stock-room";
import { findInventoryByFields } from "../inventory/get-inventory";

export async function processDeliveredPO(data: Request[], userId: number) {
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
    const requestNotOrderItemData: Partial<RequestItems>[] = data.flatMap(
      (req) =>
        req.requestItems
          .filter((item) => item.reqItemStatus === "not_ordered")
          .flatMap((item) => ({
            reqItemId: item.reqItemId,
            reqItemStatus: item.reqItemStatus,
            reqItemRemarks: item.reqItemRemarks ?? "",
          }))
    );
    if (requestNotOrderItemData) {
      await updateRequestItems({
        connection,
        updates: requestNotOrderItemData,
        keyFields: ["reqItemId"],
      });
    }
    const requestItemData: Partial<RequestItems>[] = data.flatMap((req) =>
      req.requestItems
        .filter((reqItem) => reqItem.reqItemStatus !== "not_ordered")
        .flatMap((item) => ({
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
    const stockRoom = await findStockRoomBySPFields({
      keyFields: { userId: userId },
    });
    const warehouseInv = await findInventoryByFields({
      keyFields: {
        inventoryReference: "stock-room",
        inventoryReferenceId: stockRoom[0].stockRoomId,
      },
    });
    const decerementInv: Partial<InventoryItemInterface>[] = data.flatMap(
      (req) =>
        req.requestItems
          .filter((item) => item.reqItemStatus !== "not_ordered")
          .flatMap((item) => ({
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
          data.requestItems
            .filter((reqItem) => reqItem.reqItemStatus !== "not_ordered")
            .flatMap(async (req) => {
              const inventoryItem = await findInventoryItemsByField({
                keyFields: {
                  inventoryId: warehouseInv[0].inventoryId ?? 0,
                  inventoryItemReferenceId: req.itemId,
                },
              });
              return {
                inventoryId: warehouseInv[0].inventoryId,
                inventoryItemId: inventoryItem.data[0].inventoryItemId, // fallback if not found
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
    //check if all requestItems is delivered to make the purchaserOrderItems delivered too.

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
