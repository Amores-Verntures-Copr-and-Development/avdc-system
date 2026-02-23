import { getCustomer } from "@/controllers/CustomerController";
import { customerServices } from "@/services/customer/customerServices";
import { getProducts } from "@/services/products/get-products";
import { getRequestCount } from "@/services/request/get-request";
import { getSalesServices } from "@/services/sales/get-sales";
import { getOwnerDashboardServices } from "../owner/get-owner-dashboard";

export async function getStoreDashboard(storeId: number) {
  try {
    const todaysYear = new Date().getFullYear();
    const totalSales = await getSalesServices.findSalesTotalsByStoreId({
      storeId,
    });
    const totalProducts = (await getProducts({ keyFields: { storeId } }))
      .length;
    const totalRequest = await getRequestCount(storeId);
    const totalCustomers = await customerServices.countCustomerByStoreId({
      keyFields: { storeId },
    });
    const salesChart = await getOwnerDashboardServices.getSalesChartData({
      storeId: storeId,
      year: String(todaysYear),
    });
    const recentSales = await getSalesServices.getSales({
      keyFields: { storeId },
      limit: 4,
    });
    return {
      widgets: {
        salesDetails: totalSales,
        totalProducts,
        totalRequest: totalRequest,
      },
      salesChart: salesChart,
      recentSales: recentSales,
      lowStackAlert: 0,
    };
  } catch (e) {
    throw e;
  }
}
