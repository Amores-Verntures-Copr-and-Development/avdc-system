import { selectDailyStoreSales, selectSales } from "@/models/saleModel";
import { Sales } from "@/types/sales";
import { PoolConnection } from "mysql2/promise";

export async function getDailyStoreSales() {
  try {
    const data = await selectDailyStoreSales();
    return data;
  } catch (e) {
    throw e;
  }
}

export const getSalesServices = {
  getSales: async ({
    keyFields = {},
    connection,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
  }) => {
    try {
      const data = await selectSales({ connection, keyFields });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findSalesBySaleId: async ({
    connection,
    salesId,
  }: {
    salesId: number;
    connection: PoolConnection;
  }) => {
    try {
      const data = await selectSales({
        connection,
        keyFields: {
          salesId,
        },
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
