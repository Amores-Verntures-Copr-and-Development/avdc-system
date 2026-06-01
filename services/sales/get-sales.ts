import {
  countSales,
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
    includeSaleItems,
    customer,
    limit,
    offset,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
    search?: string;
    storeName?: string;
    from?: string;
    to?: string;
    includeSaleItems?: boolean;
    customer?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const data = await selectSales({
        connection,
        keyFields,
        storeName,
        from,
        to,
        search,
        includeSaleItems,
        customer,
        limit,
        offset,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
  getSalesCount: async ({
    keyFields = {},
    connection,
    search,
    storeName,
    from,
    to,

    customer,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
    search?: string;
    storeName?: string;
    from?: string;
    to?: string;

    customer?: boolean;
  }) => {
    try {
      const data = await countSales({
        connection,
        keyFields,
        storeName,
        from,
        to,
        search,
        customer,
      });

      return data;
    } catch (e) {
      throw e;
    }
  },
  findSalesBySaleId: async ({
    connection,
    salesId,
    includeSaleItems = false,
  }: {
    salesId: number;
    connection?: PoolConnection;
    includeSaleItems?: boolean;
  }) => {
    try {
      const data = await selectSales({
        connection,
        keyFields: {
          salesId,
        },
        includeSaleItems: includeSaleItems,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findSalesTotalsByStoreId: async ({
    storeId,
    search,
    customer,
    from,
    to,
    store,
  }: {
    storeId?: number;
    search?: string;
    customer?: boolean;
    from?: string;
    to?: string;
    store?: string;
  }) => {
    try {
      const data = await selectSalesTotalDetails({ storeId, from, to, store });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
