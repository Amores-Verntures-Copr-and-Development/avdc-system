import { selectOrderCompositeItem } from "@/models/orderCompositeItemModel";
import { OrderCompositeItem } from "@/types/purchaseOrders";
import { PoolConnection } from "mysql2/promise";

// export async function getOrderCompositeServi({
//   connection,
//   keyfields = {},
// }: {
//   connection?: PoolConnection;
//   keyfields: Partial<OrderCompositeItem>;
// }) {
//   try {
//   } catch (e) {}
// }
// selectOrderCompositeItem;

export const getOrderCompositeServices = {
  findOrderCompositeByFields: async ({
    connection,
    keyfields = {},
  }: {
    connection?: PoolConnection;
    keyfields: Partial<OrderCompositeItem>;
  }) => {
    try {
      const data = await selectOrderCompositeItem({ connection, keyfields });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findOrderCompositeByPOId: async ({
    connection,
    poItemId,
  }: {
    connection?: PoolConnection;
    poItemId: number;
  }) => {
    try {
      const data = await selectOrderCompositeItem({
        connection,
        keyfields: { poItemId: poItemId },
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
