import {
  selectRequestOrderFromStockRoom,
  selectRequestOrders,
} from "@/models/requestModel";

export async function getRequestOrders({
  storeId,
  from,
  to,
  search,
  store,
}: {
  storeId?: number;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
}) {
  try {
    const data = await selectRequestOrders({
      storeId,
      from,
      to,
      search,
      store,
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
