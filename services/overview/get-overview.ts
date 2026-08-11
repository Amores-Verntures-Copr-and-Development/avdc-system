import { getSalesServices } from "../sales/get-sales";
import { getStoreBy, getStoreSales } from "../store/get-store";

export async function getOverview({
  trend,
  from,
  to,
  notZeroSales,
  storeIds,
}: {
  trend: "year" | "month" | "month" | "weeks" | "days";
  from?: string;
  to?: string;
  notZeroSales?: boolean;
  // Scopes every underlying query to this set of stores - omit for
  // unrestricted (all stores).
  storeIds?: number[];
}) {
  try {
    //get stores

    const salesDetails = await getSalesServices.findSalesTotalsByStoreId({
      from,
      to,
      storeIds,
    });
    const stores = await getStoreSales({ from, to, notZeroSales, storeIds });
    const salesByTrends = await getSalesServices.getSalesByTrend({
      trend,
      from,
      to,
      storeIds,
    });

    return {
      totalSales: salesDetails[0].totalSales,
      salesByPaymentMethods: salesDetails[0].totalSalesPaymentMethods,
      salesByTrend: salesByTrends,
      stores: stores,
    };
  } catch (e) {
    throw e;
  }
}
