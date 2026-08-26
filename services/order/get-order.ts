import { selectCountOrders, selectOrders } from "@/models/orderModel";
import { Orders } from "@/types/orders";

export async function getOrders({
  keyFields = {},
  search,
  limit,
  offset,
  companyId,
}: {
  keyFields?: Partial<Orders>;
  search?: string;
  limit?: number;
  offset?: number;
  companyId?: number;
}) {
  try {
    const data = await selectOrders({
      keyFields,
      search,
      limit,
      offset,
      companyId,
    });
    const total = await selectCountOrders({ keyFields, search, companyId });

    return { data, total };
  } catch (e) {
    throw e;
  }
}
