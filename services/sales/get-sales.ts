import {
  selectDailyStoreSales,
  selectSales,
  selectSalesTotalDetails,
} from "@/models/saleModel";
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
    search,
    storeName,
    from,
    to,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
    search?: string;
    storeName?: string;
    from?: string;
    to?: string;
  }) => {
    try {
      const data = await selectSales({
        connection,
        keyFields,
        storeName,
        from,
        to,
        search,
      });
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
  findSalesTotalsByStoreId: async ({ storeId }: { storeId: number }) => {
    try {
      const data = await selectSalesTotalDetails(storeId);
      return data;
    } catch (e) {
      throw e;
    }
  },
};
