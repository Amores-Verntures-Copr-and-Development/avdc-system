import { selectCountOrders, selectOrders } from "@/models/orderModel";
import { Orders } from "@/types/orders";

export async function getOrders({
  keyFields = {},
  search,
  limit,
  offset,
}: {
  keyFields?: Partial<Orders>;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await selectOrders({ keyFields, search, limit, offset });
    const total = await selectCountOrders({ keyFields, search });

    return { data, total };
  } catch (e) {
    throw e;
  }
}
