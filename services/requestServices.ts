import {
  CreateRequestDto,
  CreateRequestFormDto,
  InsertItemsRequestDto,
} from "@/dtos/request.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertRequest,
  insertRequestItemsBulk,
  selectCountRequest,
  selectRequestItems,
  selectRequestItemsByIds,
  selectRequestOrders,
  selectRequestOrdersByPONumber,
  updateRequest,
} from "@/models/requestModel";
import { Request, RequestItems } from "@/types/request";

import { InventoryItemInterface } from "@/types/inventory";

export async function createRequest(data: CreateRequestFormDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const requestRows = await selectCountRequest({ connection });
    const generateId = `REQ-${(requestRows.total + 1)
      .toString()
      .padStart(3, "0")}`;
    const requestData: CreateRequestDto = {
      storeId: data.storeId,
      requestById: data.requestById,
      requestNo: generateId,
    };
    const newRequeStId = await insertRequest({ connection, data: requestData });
    const requestItemData: InsertItemsRequestDto[] = data.items.map((item) => ({
      requestId: newRequeStId,
      invItem: item.invItem,
      reqItemQuantity: item.reqItemQuantity,
      reqItemStatus: "pending",
    }));
    await insertRequestItemsBulk({ connection, data: requestItemData });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}

export async function getRequestOrders({ storeId }: { storeId?: number }) {
  try {
    const data = await selectRequestOrders({ storeId });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getRequestItems({ requestId }: { requestId?: number }) {
  try {
    const data = await selectRequestItems({ requestId: requestId });
    return data;
  } catch (e) {
    throw e;
  }
}
export async function getRequestItemsByIds({
  requestId,
}: {
  requestId?: number[];
}) {
  try {
    const data = await selectRequestItemsByIds({ requestIds: requestId });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getRequestOrderByPONumber(poNumber: string) {
  try {
    const data = await selectRequestOrdersByPONumber(poNumber);
    return data;
  } catch (e) {
    throw e;
  }
}

// export async function updateRequestOrderDelivered(data: Request[]) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     //update Request Order
//     const requestData: Partial<Request>[] = data.map((req) => ({
//       requestId: req.requestId,
//       requestStatus: "delivered",
//     }));
//     await updateRequest({
//       connection,
//       keyFields: ["requestId"],
//       updates: requestData,
//     });
//     const itemData: Partial<RequestItems>[] = data.flatMap((req) =>
//       req.requestItems.map((item) => ({
//         reqItemId: item.reqItemId,
//         reqItemTransfer: item.reqItemTransfer,
//         reqItemRemarks: item.reqItemRemarks, // example: attach parent ID
//         // optional if needed
//       }))
//     );
//     // await updateROItems({
//     //   connection,
//     //   updates: itemData,
//     //   keyFields: ["reqItemId"],
//     // });
//     const inventoryItemData: Partial<InventoryItemInterface>[] = data.flatMap(
//       (req) =>
//         req.requestItems.map((item) => ({
//           inventoryItemId: item.itemId,
//           inventoryItemQuantity: item.reqItemTransfer,
//         }))
//     );
//     console.log("[inventoryItemData]: ", inventoryItemData);
//     // await updateInventoryItemsQty({
//     //   connection,
//     //   data: inventoryItemData,
//     //   adjustment: "out",
//     //   isWareHouse: true,
//     // });
//     await connection.commit();
//   } catch (e) {
//     console.error(e);

//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }

// export async function updateRequestOrderReceived(data: Request[]) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();
//   try {
//     console.log("[updateRequestOrderDelivered]: ", data);
//     await connection.beginTransaction();
//     //update Request Order
//     const requestData: Partial<Request>[] = data.map((req) => ({
//       requestId: req.requestId,
//       requestStatus: "received",
//     }));
//     await updateRequest({
//       connection,
//       keyFields: ["requestId"],
//       updates: requestData,
//     });
//     const itemData: Partial<RequestItems>[] = data.flatMap((req) =>
//       req.requestItems.map((item) => ({
//         reqItemId: item.reqItemId,
//         reqItemReceived: item.reqItemReceived,
//       }))
//     );
//     await updateROItems({
//       connection,
//       updates: itemData,
//       keyFields: ["reqItemId"],
//     });

//     //update inventory
//     const inventoryItemData: Partial<InventoryItemInterface>[] = data.flatMap(
//       (req) =>
//         req.requestItems.map((item) => ({
//           inventoryItemId: item.invItem,
//           inventoryItemQuantity: item.reqItemReceived,
//         }))
//     );
//     console.log("[updateInventoryItemsQty]: ", inventoryItemData);
//     // await updateInventoryItemsQty({
//     //   connection,
//     //   data: inventoryItemData,
//     //   adjustment: "in",
//     // });
//     await connection.commit();
//   } catch (e) {
//     console.error(e);

//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }
