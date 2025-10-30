import {
  CreatePurchaseOrderDto,
  CreatePurchaseOrderFormDto,
  CreatePurchaseOrderItemDto,
  CreatePurchaseOrderRequestDto,
  DisplayPOItemsSupplier,
  DisplayPurchaseOrderItemsDto,
  UpdatePurchaseOrdersDto,
} from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import {
  insertPurchaseOrder,
  insertPurchaseOrderItems,
  insertPurchaseOrderRequest,
  selectCountPurchaseOrder,
  selectPurchaseOrder,
  selectPurchaseOrderItems,
  selectPurchaseOrderItemsSupplier,
  updatePOItems,
  updatePurchaseOrder,
} from "@/models/purchaseOrderModel";
import { updateRequest } from "@/models/requestModel";
import { InventoryItemInterface } from "@/types/inventory";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

// export async function createPurchaseOrder(data: CreatePurchaseOrderFormDto) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();

//     const poRows = await selectCountPurchaseOrder({ connection });
//     const generateId = `PO-${(poRows.total + 1).toString().padStart(3, "0")}`;
//     const purhcaseOrderData: CreatePurchaseOrderDto = {
//       ...data,
//       poNumber: generateId,
//     };
//     const purchaseOrderId = await insertPurchaseOrder({
//       connection,
//       data: purhcaseOrderData,
//     });

//     const purchaseOrderRequestData: CreatePurchaseOrderRequestDto[] =
//       data.purchaseOrderRequest.map((request) => ({
//         poId: purchaseOrderId,
//         requestId: request.requestId,
//       }));
//     await insertPurchaseOrderRequest({
//       connection,
//       data: purchaseOrderRequestData,
//     });
//     const purchaseOrderItems: CreatePurchaseOrderItemDto[] =
//       data.purchaseOrderItems.map((item) => ({
//         ...item,
//         poId: purchaseOrderId,
//       }));
//     await insertPurchaseOrderItems({ connection, data: purchaseOrderItems });
//     await updateRequest({
//       connection,
//       requestIds: data.purchaseOrderRequest.map((req) => req.requestId),
//       requestStatus: "in_progress",
//     });
//     await connection.commit();
//   } catch (e) {
//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }

export async function findAllPurchaseOrder() {
  try {
    const data = await selectPurchaseOrder({});
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findPOItemsById({
  poId,
  connection,
}: {
  poId: number;
  connection?: PoolConnection;
}) {
  try {
    const data = await selectPurchaseOrderItems({ connection, poId });
    return data;
  } catch (e) {
    throw e;
  }
}

// export async function approvedPurchaseOrderById(data: UpdatePurchaseOrdersDto) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();

//   try {
//     await connection.beginTransaction();
//     await updatePurchaseOrder({
//       key: { poId: data.poId },
//       values: { poStatus: "approved" },
//     });
//     const updateItems: Partial<PurchaseOrderItems>[] =
//       data.poItems?.map((items) => ({
//         poItemId: items.poItemId,
//         suppId: items.suppId,
//         unitPrice: items.unitPrice,
//       })) ?? [];
//     await updatePOItems({
//       connection,
//       updates: updateItems,
//       keyFields: ["poItemId"],
//     });
//     await connection.commit();
//   } catch (e) {
//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }

export async function findPOItemsSupplierById(poId: number) {
  try {
    const data = await selectPurchaseOrderItemsSupplier(poId);
    const grouped = data.reduce((acc: any[], row) => {
      const supplierId = row.suppId || 0;
      let supplierGroup: DisplayPOItemsSupplier = acc.find(
        (g) => g.suppId === supplierId
      );

      if (!supplierGroup) {
        supplierGroup = {
          suppId: row.suppId,
          suppCode: row.suppCode,
          suppName: row.suppName,
          suppContactPerson: row.suppContactPerson,
          suppEmail: row.suppEmail,
          suppAddress: row.suppAddress,
          suppPhone: row.suppPhone,
          suppStatus: row.suppStatus,
          suppCreatedAt: row.suppCreatedAt,
          suppUpdatedAt: row.suppUpdatedAt,
          suppCreatedBy: row.suppCreatedBy,
          items: [],
        };
        acc.push(supplierGroup);
      }
      supplierGroup.items.push({
        poItemId: row.poItemId,
        itemId: row.itemId,
        itemName: row.itemName,
        unitPrice: row.unitPrice,
        poItemOrderedQty: row.poItemOrderedQty,

        poItemReceivedQty: row.poItemReceivedQty,
        poItemStatus: row.poItemStatus,
        poId: row.poId,
        suppId: row.suppId,
        isSent: row.isSent,
      });

      return acc;
    }, []);

    return grouped;
  } catch (e) {
    throw e;
  }
}

// export async function updatePurchaseOrderSent(
//   poId: number,
//   items: PurchaseOrderItems[]
// ) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     //update PO to sent
//     await updatePurchaseOrder({
//       connection,
//       keyFields: ["poId"]
//       values: { poStatus: "sent" },
//     });
//     const updateItems = items.map((i) => ({
//       poId: i.poId,
//       isSent: 1,
//     }));
//     await updatePOItems({
//       connection,
//       keyFields: ["poId"],
//       updates: updateItems,
//     });
//     console.log("Agi here");
//     //update PO items to sent
//     await connection.commit();
//   } catch (e) {
//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }

// export async function updatePurchaseOrderReceive(
//   poId: number,
//   items: PurchaseOrderItems[]
// ) {
//   const pool = await getDBConnection();
//   const connection = await pool.getConnection();
//   try {
//     await connection.beginTransaction();
//     await updatePurchaseOrder({
//       connection,
//       key: { poId: poId },
//       values: { poStatus: "received" },
//     });
//     const updateItems: Partial<PurchaseOrderItems>[] = items.map((i) => ({
//       poItemId: i.poItemId,
//       poItemReceivedQty: i.poItemReceivedQty,
//       poItemStatus: "received",
//     }));
//     await updatePOItems({
//       connection,
//       keyFields: ["poItemId"],
//       updates: updateItems,
//     });
//     const inventoryItemData: Partial<InventoryItemInterface>[] = items.map(
//       (item) => ({
//         inventoryItemId: item.itemId,
//         inventoryItemQuantity: item.poItemReceivedQty,
//       })
//     );
//     console.log("[inventoryItemData]: ", inventoryItemData);
//     await updateInventoryItemsQty({
//       connection,
//       data: inventoryItemData,
//       adjustment: "in",
//       isWareHouse: true,
//     });
//     await connection.commit();
//   } catch (e) {
//     await connection.rollback();
//     throw e;
//   } finally {
//     connection.release();
//   }
// }
