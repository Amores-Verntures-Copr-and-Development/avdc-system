import {
  countSales,
  countSalesByProductVariant,
  countSalesTransactionsByProductVariant,
  selectDailyStoreSales,
  selectSales,
  selectSalesByProductVariant,
  selectSalesByTrend,
  selectSalesTotalDetails,
  selectSalesTransactionsByProductVariant,
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
    customerType,
    limit,
    offset,
    customerId,
    storeId,
    method,
    nolimit,
    excludeStatus,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
    search?: string;
    storeName?: string;
    from?: string;
    to?: string;
    includeSaleItems?: boolean;
    customer?: boolean;
    customerType?: "customer" | "walk-in";
    limit?: number;
    offset?: number;
    customerId?: number;
    storeId?: number;
    method?: string;
    nolimit?: boolean;
    excludeStatus?: string | string[];
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
        customerType,
        limit,
        offset,
        customerId,
        storeId,
        method,
        nolimit,
        excludeStatus,
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
    customerId,
    customer,
    customerType,
    storeId,
    method,
    excludeStatus,
  }: {
    keyFields?: Partial<Sales>;
    connection?: PoolConnection;
    search?: string;
    storeName?: string;
    from?: string;
    to?: string;
    customerId?: number;
    customer?: boolean;
    customerType?: "customer" | "walk-in";
    storeId?: number;
    method?: string;
    excludeStatus?: string | string[];
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
        customerType,
        customerId,
        storeId,
        method,
        excludeStatus,
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
    storeIds,
    search,
    customer,
    customerType,
    from,
    to,
    store,
    notZeroSales,
  }: {
    storeId?: number;
    storeIds?: number[];
    search?: string;
    customer?: boolean;
    customerType?: "customer" | "walk-in";
    from?: string;
    to?: string;
    store?: string;
    notZeroSales?: boolean;
  }) => {
    try {
      const data = await selectSalesTotalDetails({
        storeId,
        storeIds,
        from,
        to,
        store,
        customerType,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },

  getSalesByTrend: async ({
    trend,
    from,
    to,
    storeIds,
  }: {
    trend?: "year" | "month" | "weeks" | "days";
    from?: string;
    to?: string;
    storeIds?: number[];
  }) => {
    return await selectSalesByTrend({ trend, from, to, storeIds });
  },

  getSalesByProductVariant: async ({
    storeId,
    storeName,
    search,
    from,
    to,
    limit,
    offset,
  }: {
    storeId?: number;
    storeName?: string;
    search?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await selectSalesByProductVariant({
      storeId,
      storeName,
      search,
      from,
      to,
      limit,
      offset,
    });
  },

  getSalesByProductVariantCount: async ({
    storeId,
    storeName,
    search,
    from,
    to,
  }: {
    storeId?: number;
    storeName?: string;
    search?: string;
    from?: string;
    to?: string;
  }) => {
    return await countSalesByProductVariant({
      storeId,
      storeName,
      search,
      from,
      to,
    });
  },

  getSalesTransactionsByProductVariant: async ({
    prodVarId,
    storeId,
    storeName,
    from,
    to,
    limit,
    offset,
  }: {
    prodVarId: number;
    storeId?: number;
    storeName?: string;
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }) => {
    return await selectSalesTransactionsByProductVariant({
      prodVarId,
      storeId,
      storeName,
      from,
      to,
      limit,
      offset,
    });
  },

  getSalesTransactionsByProductVariantCount: async ({
    prodVarId,
    storeId,
    storeName,
    from,
    to,
  }: {
    prodVarId: number;
    storeId?: number;
    storeName?: string;
    from?: string;
    to?: string;
  }) => {
    return await countSalesTransactionsByProductVariant({
      prodVarId,
      storeId,
      storeName,
      from,
      to,
    });
  },
};
