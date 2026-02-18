import {
  selectRequestItems,
  selectRequestItemsById,
  selectRequestItemsByPOId,
  selectRequetItemsByPOId,
  selectRequetItemsByPOItemIdWithConversion,
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

export async function findRequestItemsByPOItemId({
  connection,
  poItemId,
}: {
  connection: PoolConnection;
  poItemId: number[];
}) {
  try {
    const data = await selectRequetItemsByPOId({ connection, poItemId });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findRequestItemsByPoItemIdWithConverions({
  connection,
  poItemId,
}: {
  connection: PoolConnection;
  poItemId: number;
}) {
  try {
    const data = await selectRequetItemsByPOItemIdWithConversion({
      connection,
      poItemId,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findRequestItemsByPOId({
  poId,
  connection,
}: {
  connection?: PoolConnection;
  poId: number;
}) {
  try {
    const data = await selectRequestItemsByPOId({ connection, poId });
    return data;
  } catch (e) {
    throw e;
  }
}
