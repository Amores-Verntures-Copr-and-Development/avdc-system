import { getDBConnection } from "@/lib/db";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { Request, RequestItems } from "@/types/request";
import { updateRequests } from "./update-request";
import { updateRequestItems } from "./request-items/update-request-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";

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
    const requestItems: Partial<RequestItems>[] = data.flatMap((req) =>
      req.requestItems.flatMap((item) => ({
        reqItemId: item.reqItemId,
        reqItemReceived: item.reqItemReceived,
        reqItemRemarks: item.reqItemRemarks,
      }))
    );
    await updateRequestItems({
      connection,
      updates: requestItems,
      keyFields: ["reqItemId"],
    });
    const addInventoryQty: Partial<InventoryItemInterface>[] =
      data.flatMap((req) =>
        req.requestItems.flatMap((item) => ({
          inventoryItemId: item.invItem,
          inventoryItemQuantity: item.reqItemReceived,
        }))
      ) || [];
    console.log({ request, requestItems, addInventoryQty });
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: addInventoryQty,
      keyFields: ["inventoryItemId"],
    });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
