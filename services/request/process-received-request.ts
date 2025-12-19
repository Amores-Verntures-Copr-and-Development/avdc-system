import { getDBConnection } from "@/lib/db";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { Request, RequestItems } from "@/types/request";
import { updateRequests } from "./update-request";
import { updateRequestItems } from "./request-items/update-request-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryByFields } from "../inventory/get-inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";

export async function processReceivedRequest(data: Request[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //Upadte RO received
    const request: Partial<Request>[] = data.map((req) => ({
      requestId: req.requestId,
      requestStatus: "received",
    }));
    await updateRequests({
      connection,
      keyFields: ["requestId"],
      updates: request,
    });

    const validReceivedRequestItems: Partial<RequestItems>[] = data.flatMap(
      (req) =>
        req.requestItems
          .filter((it) => it.reqItemStatus !== "not_ordered")
          .flatMap((item) => ({
            invItem: item.invItem,
            reqItemId: item.reqItemId,
            reqItemReceived: item.reqItemReceived,
            reqItemStatus: "received",
            reqItemRemarks: item.reqItemRemarks,
            ...(Number(item.reqItemTransfer) === 0
              ? { reqItemTransfer: item.reqItemReceived }
              : {}),
          }))
    );
    await updateRequestItems({
      connection,
      updates: validReceivedRequestItems,
      keyFields: ["reqItemId"],
    });
    const notOrderedData: Partial<RequestItems>[] = data.flatMap((req) =>
      req.requestItems
        .filter((it) => it.reqItemStatus === "not_ordered")
        .flatMap((item) => ({
          reqItemId: item.reqItemId,
          reqItemStatus: "not_ordered",
          reqItemReceived: 0,
        }))
    );
    if (notOrderedData && notOrderedData.length > 0) {
      await updateRequestItems({
        connection,
        updates: notOrderedData,
        keyFields: ["reqItemId"],
      });
    }
    console.log({ notOrderedData });
    const addInventoryQty: Partial<InventoryItemInterface>[] =
      validReceivedRequestItems.flatMap((item) => ({
        inventoryItemId: item.invItem,
        inventoryItemQuantity: item.reqItemReceived,
      })) || [];
    console.log({ addInventoryQty });
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: addInventoryQty,
      keyFields: ["inventoryItemId"],
    });
    const storeInventoryMovement: CreateInventoryMovementDto[] =
      await Promise.all(
        data.flatMap((data) =>
          data.requestItems
            .filter((i) => i.reqItemStatus !== "not_ordered")
            .flatMap(async (item) => {
              const inventoryId = await findInventoryByFields({
                keyFields: {
                  inventoryReferenceId: data.storeId,
                  inventoryReference: "store",
                },
              });
              return {
                inventoryId: inventoryId[0].inventoryId,
                inventoryItemId: item.invItem, // fallback if not found
                itemMovementType: "in",
                itemMovementReferenceId: item.requestId ?? 0,
                itemMovementReference: "ro",
                itemMovementQuantity: Number(item.reqItemReceived),
                itemMovementRemarks: "Received item from request order",
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
