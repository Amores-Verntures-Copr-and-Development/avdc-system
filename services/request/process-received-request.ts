import { getDBConnection } from "@/lib/db";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { Request, RequestItems } from "@/types/request";
import { updateRequests } from "./update-request";
import { updateRequestItems } from "./request-items/update-request-items";
import { updateInventoryItem } from "../inventory/inventory-items/update-inventory-items";
import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { findInventoryByFields } from "../inventory/get-inventory";
import { createInventoryMovement } from "../inventory/inventory-movement/create-inventory-movement";
import { getRequestItems, getRequestItemsByIds } from "../requestServices";
import { getRequestOrderItems } from "./request-items/get-request-items";
import { it } from "node:test";

export async function processReceivedRequest(data: Request) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const validReceivedRequestItems: Partial<RequestItems>[] = data.requestItems
      .filter(
        (it) =>
          it.reqItemStatus !== "not_ordered" &&
          it.reqItemStatus === "delivered" &&
          (!it.reqItemToFollow || Number(!it.reqItemToFollow) === 0),
      )
      .flatMap((item) => ({
        invItem: item.invItem,
        reqItemId: item.reqItemId,
        reqItemReceived: item.reqItemReceived,
        reqItemStatus: "received",
        reqItemRemarks: item.reqItemRemarks,
        ...(Number(item.reqItemTransfer) === 0
          ? { reqItemTransfer: item.reqItemReceived }
          : {}),
      }));

    console.log({ validReceivedRequestItems });
    const validReceivedToFollowRequestItems: Partial<RequestItems>[] =
      data.requestItems
        .filter(
          (it) =>
            it.reqItemStatus !== "not_ordered" &&
            it.reqItemStatus === "delivered" &&
            Number(it.reqItemToFollow) !== 0 &&
            Number(it.reqItemReceived) !== 0,
        )
        .flatMap((item) => ({
          invItem: item.invItem,
          reqItemId: item.reqItemId,
          reqItemReceived:
            Number(item.receivedToFollow) + Number(item.reqItemReceived),
          reqItemStatus: "received",
          reqItemRemarks: item.reqItemRemarks,
          ...(Number(item.reqItemTransfer) === 0
            ? { reqItemTransfer: item.reqItemReceived }
            : {}),
        }));
    const validFromPartialToReceivedItems: Partial<RequestItems>[] =
      data.requestItems
        .filter(
          (it) =>
            it.reqItemStatus !== "not_ordered" &&
            it.reqItemStatus === "partial" &&
            !Number(it.receivedToFollow),
        )
        .flatMap((item) => ({
          invItem: item.invItem,
          reqItemId: item.reqItemId,
          reqItemReceived: Number(item.reqItemReceived),
          reqItemStatus: "partial",
          reqItemRemarks: item.reqItemRemarks,
          ...(Number(item.reqItemTransfer) === 0
            ? { reqItemTransfer: item.reqItemReceived }
            : {}),
        }));

    if (validReceivedRequestItems && validReceivedRequestItems.length > 0) {
      await updateRequestItems({
        connection,
        updates: validReceivedRequestItems,
        keyFields: ["reqItemId"],
      });
    }
    if (
      validReceivedToFollowRequestItems &&
      validReceivedToFollowRequestItems.length > 0
    ) {
      await updateRequestItems({
        connection,
        updates: validReceivedToFollowRequestItems,
        keyFields: ["reqItemId"],
      });
    }
    const validToAdd: Partial<RequestItems>[] = [
      ...validReceivedRequestItems,
      ...validFromPartialToReceivedItems,
      ...validReceivedToFollowRequestItems,
    ];
    console.log({
      validReceivedRequestItems,
      validFromPartialToReceivedItems,
      validReceivedToFollowRequestItems,
    });

    const addInventoryQty: Partial<InventoryItemInterface>[] =
      validToAdd.map((item) => ({
        inventoryItemId: item.invItem,
        inventoryItemQuantity: item.reqItemReceived,
      })) || [];
    await updateInventoryItem({
      connection,
      fieldModes: { inventoryItemQuantity: "increment" },
      updates: addInventoryQty,
      keyFields: ["inventoryItemId"],
    });
    if (validToAdd) {
      const inventoryId = await findInventoryByFields({
        keyFields: {
          inventoryReferenceId: data.storeId,
          inventoryReference: "store",
        },
      });
      const storeInventoryMovement: CreateInventoryMovementDto[] =
        validToAdd.map((i) => ({
          inventoryId: inventoryId[0].inventoryId,
          inventoryItemId: Number(i.invItem), // fallback if not found
          itemMovementType: "in",
          itemMovementReferenceId: i.requestId ?? 0,
          itemMovementReference: "ro",
          itemMovementQuantity: Number(i.reqItemReceived),
          itemMovementRemarks: "Received item from request order",
        })) ?? [];
      await createInventoryMovement({
        connection,
        data: storeInventoryMovement,
      });
    }

    const requestItems = await getRequestOrderItems({
      requestId: data.requestId,
      connection,
    });
    // console.log({ requestItems });

    const isAllItemReceived = requestItems
      .filter((i) => i.reqItemStatus !== "not_ordered")
      .every((i) => i.reqItemStatus === "received");

    if (isAllItemReceived) {
      const request: Partial<Request> = {
        requestId: data.requestId,
        requestStatus: "received",
      };
      await updateRequests({
        connection,
        keyFields: ["requestId"],
        updates: [request],
      });
    }

    //check if all req items is received then update the request
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
