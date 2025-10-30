import {
  selectRequestItems,
  selectRequestItemsById,
} from "@/models/requestModel";
import { PoolConnection } from "mysql2/promise";

export async function getRequestOrderItems({
  requestId,
  connection,
}: {
  requestId?: number;
  connection?: PoolConnection;
}) {
  try {
    const data = await selectRequestItems({ requestId, connection });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findRequestOrderItemById({
  requestId,
  itemId,
}: {
  requestId?: number;
  itemId?: number;
}) {
  try {
    const data = await selectRequestItemsById({ requestId, itemId });
    return data;
  } catch (e) {
    throw e;
  }
}
