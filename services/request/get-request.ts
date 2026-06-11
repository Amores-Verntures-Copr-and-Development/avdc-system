import {
  selectCountRequest,
  selectRequestOrderFromStockRoom,
  selectRequestOrders,
} from "@/models/requestModel";
import { Request } from "@/types/request";

export async function getRequestOrders({
  storeId,
  from,
  to,
  search,
  store,
  keyfields = {},
}: {
  storeId?: number;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
  keyfields?: Partial<Request>;
}) {
  try {
    const data = await selectRequestOrders({
      storeId,
      from,
      to,
      search,
      store,
      keyfields,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getRequestOrderFromStockRoomByPurchaserFields(
  userId: number,
) {
  try {
    const data = await selectRequestOrderFromStockRoom(userId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getRequestCount(storeId: number) {
  try {
    const data = await selectCountRequest({ keyFields: { storeId } });
    return data;
  } catch (e) {
    throw e;
  }
}
