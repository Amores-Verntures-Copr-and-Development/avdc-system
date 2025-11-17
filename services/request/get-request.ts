import {
  selectRequestOrderFromStockRoom,
  selectRequestOrders,
} from "@/models/requestModel";

export async function getRequestOrders({ storeId }: { storeId?: number }) {
  try {
    const data = await selectRequestOrders({ storeId });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getRequestOrderFromStockRoomByPurchaserFields(
  userId: number
) {
  try {
    const data = await selectRequestOrderFromStockRoom(userId);
    return data;
  } catch (e) {
    throw e;
  }
}
