import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { insertPurchaseOrderItems } from "@/models/purchaseOrderModel";
import { insertRequestItemsBulk } from "@/models/requestModel";
import { findRequestItemsByPoItemIdWithConverions } from "@/services/request/request-items/get-request-items";
import { PurchaseOrderItems } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";
import { updatePurchaseOrderItems } from "./update-purchase-items";

export async function createPurchaseOrderItem({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreatePurchaseOrderItemDto[];
}) {
  try {
    await insertPurchaseOrderItems({ connection, data });
  } catch (e) {
    throw e;
  }
}

export async function createPurchaseOrderItemWithSupplier({
  connection,
  data,
  continueInsert,
  secondSubmit,
  poId,
}: {
  connection?: PoolConnection;
  data: CreatePurchaseOrderItemDto;
  poId?: number;
  secondSubmit?: boolean;
  continueInsert?: boolean;
}) {
  let localConnection = false;
  let newConnection: any;
  let isAlreadyDeliveredInRequest: boolean = false;
  if (!connection) {
    localConnection = true;
    const newPool = await getDBConnection();
    newConnection = await newPool.getConnection();
    await newConnection.beginTransaction();
  }
  try {
    if (!secondSubmit && !continueInsert) {
      const insertedIds = await insertPurchaseOrderItems({
        connection: connection ? connection : newConnection,
        data: [data],
      });
      if (insertedIds) {
        const checkRequestItems =
          await findRequestItemsByPoItemIdWithConverions({
            connection: connection ? connection : newConnection,
            poItemId: insertedIds[0],
          });
        const isAllDeliveredOrReceive = checkRequestItems.every(
          (i) =>
            i.reqItemStatus === "delivered" || i.reqItemStatus === "received",
        );
        isAlreadyDeliveredInRequest = isAllDeliveredOrReceive;
      }
      if (isAlreadyDeliveredInRequest) {
        if (localConnection) {
          await newConnection.rollback();
        }
      }
      return {
        isAlreadyDeliveredInRequest: isAlreadyDeliveredInRequest,
      };
    }
    if (secondSubmit) {
      if (continueInsert) {
        const modifyData: CreatePurchaseOrderItemDto = {
          ...data,
        };
        const insertedIds = await insertPurchaseOrderItems({
          connection: connection ? connection : newConnection,
          data: [modifyData],
        });
        if (insertedIds) {
          const checkRequestItems =
            await findRequestItemsByPoItemIdWithConverions({
              connection: connection ? connection : newConnection,
              poItemId: insertedIds[0],
            });
          const isAllDeliveredOrReceive = checkRequestItems.every(
            (i) =>
              i.reqItemStatus === "delivered" || i.reqItemStatus === "received",
          );
          const isAllReceived = checkRequestItems.every(
            (i) => i.reqItemStatus === "received",
          );
          isAlreadyDeliveredInRequest = isAllDeliveredOrReceive;
          const updateNew: Partial<PurchaseOrderItems> = {
            poItemId: insertedIds[0],
            poItemStatus: isAllReceived ? "received_store" : "delivered",
          };
          await updatePurchaseOrderItems({
            keyFields: ["poItemId"],
            updates: [updateNew],
            connection: connection ? connection : newConnection,
          });
        }
        if (localConnection) {
          await newConnection.commit();
        }
        return {
          success: true,
          insertedUpdate: true,
        };
      } else {
        const modifyData: CreatePurchaseOrderItemDto = {
          ...data,
          poItemStatus: "pending",
        };

        await insertPurchaseOrderItems({
          connection: connection ? connection : newConnection,
          data: [modifyData],
        });
        if (localConnection) {
          await newConnection.commit();
        }
        return {
          success: true,
          insertedOnly: true,
        };
      }
    }
  } catch (e) {
    if (localConnection) {
      await newConnection.rollback();
    }
    throw e;
  } finally {
    if (localConnection) {
      await newConnection.release();
    }
  }
}
