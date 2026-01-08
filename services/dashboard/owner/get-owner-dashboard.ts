import {
  selectOwnerDashboardStats,
  selectPurchaseOrderMonthlyData,
  selectSalesChartData,
  selectStoresRecentSales,
} from "@/models/dashboardModels";
import { get } from "http";

export const getOwnerDashboardServices = {
  getTotalMetrics: async () => {
    try {
      const data = await selectOwnerDashboardStats();
      return data;
    } catch (e) {
      console.error("Error fetching owner dashboard metrics:", e);
      throw e;
    }
  },
  getRecentStoreSales: async () => {
    try {
      const data = await selectStoresRecentSales();
      return data;
    } catch (e) {
      console.error("Error fetching recent store sales:", e);
      throw e;
    }
  },
  getSalesChartData: async (year: string) => {
    try {
      const monthlySales = await selectSalesChartData({ year });

      const allMonths = Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i).toLocaleString("default", { month: "long" })
      );

      const revenueMap = new Map<string, number>();

      (monthlySales ?? []).forEach((item) => {
        const monthName = new Date(2000, item.monthNumber - 1).toLocaleString(
          "default",
          { month: "long" }
        );

        revenueMap.set(monthName, Number(item.totalSales));
      });

      return allMonths.map((month) => ({
        month,
        totalSales: revenueMap.get(month) ?? 0,
      }));
    } catch (e) {
      console.error("Error fetching sales chart data:", e);
      throw e;
    }
  },
  getPurchaseOrderChartData: async (year: string) => {
    try {
      const monthlySales = await selectPurchaseOrderMonthlyData({ year });
      const allMonths = Array.from({ length: 12 }, (_, i) =>
        new Date(2000, i).toLocaleString("default", { month: "long" })
      );

      const revenueMap = new Map<string, number>();

      (monthlySales ?? []).forEach((item) => {
        const monthName = new Date(2000, item.monthNumber - 1).toLocaleString(
          "default",
          { month: "long" }
        );

        revenueMap.set(monthName, Number(item.totalPurchase));
      });

      const completeData = allMonths.map((month) => ({
        month,
        totalPurchase: revenueMap.get(month) ?? 0,
      }));
      return completeData;
    } catch (e) {
      console.error("Error fetching purchase order chart data:", e);
      throw e;
    }
  },
};
