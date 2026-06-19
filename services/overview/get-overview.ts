import { getSalesServices } from "../sales/get-sales";
import { getStoreBy, getStoreSales } from "../store/get-store";

export async function getOverview({
  trend,
  from,
  to,
}: {
  trend: "year" | "month" | "month" | "weeks" | "days";
  from?: string;
  to?: string;
}) {
  try {
    //get stores

    const salesDetails = await getSalesServices.findSalesTotalsByStoreId({
      from,
      to,
    });
    const stores = await getStoreSales({ from, to });
    const salesByTrends = await getSalesServices.getSalesByTrend({
      trend,
      from,
      to,
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
