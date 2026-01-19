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
import { getRequestItems } from "../requestServices";
import { getRequestOrderItems } from "./request-items/get-request-items";

export async function processDeliveredPO(data: Request[], userId: number) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const requestPartial: RequestItems[] = data.flatMap(
      (req) =>
        req.requestItemsData?.filter(
          (item) =>
            item.reqItemStatus === "partial" &&
            Number(item.reqItemTransfer) !== 0 &&
            Number(item.reqItemToFollow) === 0
        ) ?? []
    );
    const requestDelivered: RequestItems[] = data.flatMap(
      (req) =>
        req.requestItemsData?.filter(
          (item) => item.reqItemStatus === "pending"
        ) ?? []
    );
    const isToFollowItems = data.flatMap(
      (req) =>
        req.requestItemsData?.filter(
          (item) =>
            item.reqItemStatus === "partial" &&
            Number(item.reqItemToFollow) !== 0 &&
            Number(item.reqItemToFollow) !== 0
        ) ?? []
    );
    const requestItemToDeduct: RequestItems[] = [
      ...requestPartial,
      ...requestDelivered,
      ...isToFollowItems,
    ];

    console.log({ requestPartial, isToFollowItems });
    const requestNotOrdered: RequestItems[] = data.flatMap(
      (req) =>
        req.requestItemsData?.filter(
          (item) => item.reqItemStatus === "not_ordered"
        ) ?? []
    );

    if (requestPartial && requestPartial.length > 0) {
      const updatePartial: Partial<RequestItems>[] = requestPartial.map(
        (i) => ({
          reqItemId: i.reqItemId,
          reqItemTransfer: Number(i.reqItemTransfer),
          reqItemStatus: "partial",
        })
      );

      await updateRequestItems({
        connection,
        updates: updatePartial,
        keyFields: ["reqItemId"],
      });
      //Perform update request
      //Insert to inventory
      //
    }

    if (requestDelivered && requestDelivered.length > 0) {
      const updateDelivered: Partial<RequestItems>[] = requestDelivered.map(
        (i) => ({
          reqItemId: i.reqItemId,
          reqItemTransfer: Number(i.reqItemTransfer),
          reqItemStatus: "delivered",
        })
      );
      console.log({ updateDelivered });
      await updateRequestItems({
        connection,
        updates: updateDelivered,
        keyFields: ["reqItemId"],
      });
      //Perform update request
      //Insert to inventory
      //
    }
    if (requestNotOrdered && requestNotOrdered.length > 0) {
      const updateDelivered: Partial<RequestItems>[] = requestNotOrdered.map(
        (i) => ({
          reqItemId: i.reqItemId,
          reqItemStatus: "not_ordered",
        })
      );
      await updateRequestItems({
        connection,
        updates: updateDelivered,
        keyFields: ["reqItemId"],
      });
      //Perform update request
      //Insert to inventory
      //
    }
    if (requestDelivered && requestDelivered.length > 0) {
      const updateDelivered: Partial<RequestItems>[] = requestDelivered.map(
        (i) => ({
          reqItemId: i.reqItemId,
          reqItemTransfer: Number(i.reqItemTransfer),
          reqItemStatus: "delivered",
        })
      );
      await updateRequestItems({
        connection,
        updates: updateDelivered,
        keyFields: ["reqItemId"],
      });
      //Perform update request
      //Insert to inventory
      //
    }

    if (isToFollowItems) {
      const updateToFollow: Partial<RequestItems>[] = isToFollowItems.map(
        (i) => ({
          reqItemId: i.reqItemId,
          reqItemToFollow: Number(i.reqItemToFollow),
          reqItemStatus: "delivered",
        })
      );
      await updateRequestItems({
        connection,
        updates: updateToFollow,
        keyFields: ["reqItemId"],
      });
    }
    // console.log({ requestDelivered, requestPartial, requestNotOrdered });
    if (requestItemToDeduct && requestItemToDeduct.length > 0) {
      const stockRoom = await findStockRoomBySPFields({
        keyFields: { userId: userId },
      });
      const warehouseInv = await findInventoryByFields({
        keyFields: {
          inventoryReference: "stock-room",
          inventoryReferenceId: stockRoom[0].stockRoomId,
        },
      });
      const decerementInv: Partial<InventoryItemInterface>[] =
        requestItemToDeduct.map((item) => ({
          inventoryId: warehouseInv[0].inventoryId,
          inventoryItemReferenceId: item.itemId,
          inventoryItemQuantity: item.reqItemTransfer,
        }));
      await updateInventoryItem({
        connection,
        fieldModes: { inventoryItemQuantity: "decrement" },
        updates: decerementInv,
        keyFields: ["inventoryItemReferenceId", "inventoryId"],
      });
      const storeInventoryMovement: CreateInventoryMovementDto[] =
        await Promise.all(
          requestItemToDeduct.map(async (i) => {
            const inventoryItem = await findInventoryItemsByField({
              keyFields: {
                inventoryId: warehouseInv[0].inventoryId ?? 0,
                inventoryItemReferenceId: i.itemId,
              },
            });
            return {
              inventoryId: warehouseInv[0].inventoryId,
              inventoryItemId: inventoryItem.data[0].inventoryItemId, // fallback if not found
              itemMovementType: "out",
              itemMovementReferenceId: i.requestId ?? 0,
              itemMovementReference: "ro",
              itemMovementQuantity: Number(i.reqItemTransfer),
              itemMovementRemarks: "Deliver item to store",
            };
          })
        );
      await createInventoryMovement({
        connection,
        data: storeInventoryMovement,
      });
    }
    //Check if all the request
    const requestUpdate: Partial<Request>[] = (
      await Promise.all(
        data.map(async (req) => {
          const reqItems = await getRequestOrderItems({
            requestId: req.requestId,
            connection,
          });

          // Check if all valid items are delivered
          const validItemsDelivered = reqItems
            .filter((i) => i.reqItemStatus !== "not_ordered")
            .every((i) => i.reqItemStatus === "delivered");

          // Only return object if all delivered
          return validItemsDelivered
            ? { requestId: req.requestId, requestStatus: "delivered" }
            : [];
        })
      )
    ).flat() as Partial<Request>[];
    if (requestUpdate && requestUpdate.length > 0) {
      await updateRequests({
        connection,
        keyFields: ["requestId"],
        updates: requestUpdate,
      });
    }
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
