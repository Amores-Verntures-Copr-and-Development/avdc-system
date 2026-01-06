import { selectSalesItems } from "@/models/saleModel";
import { SaleItems } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";

export const getSalesItemServices = {
  findSaleItemsByFields: async ({
    keyFields = {},
    connection,
  }: {
    keyFields: Partial<SaleItems>;
    connection?: PoolConnection;
  }) => {
    try {
      const data = await selectSalesItems({ connection, keyFields });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findSaleItemsBySalesId: async ({
    salesId,
    connection,
  }: {
    salesId: number;
    connection?: PoolConnection;
  }) => {
    try {
      const data = await selectSalesItems({
        connection,
        keyFields: { salesId },
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
