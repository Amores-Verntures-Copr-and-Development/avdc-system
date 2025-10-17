import { selectRequestOrders } from "@/models/requestModel";

export async function getRequestOrders({ storeId }: { storeId?: number }) {
  try {
    const data = await selectRequestOrders({ storeId });
    return data;
  } catch (e) {
    throw e;
  }
}
