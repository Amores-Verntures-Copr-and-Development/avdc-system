import { getOwnerDashboardServices } from "@/services/dashboard/owner/get-owner-dashboard";
import {
  findPendingRequestByUserId,
  getDashboardStats,
} from "@/services/dashboard/purchaser/get-dashboard-stats";
import { getStoreDashboard } from "@/services/dashboard/store/get-store-dashboard";

export const getDashboardStatsByRole = async (
  position: "purchaser" | "admin",
  userId?: number,
) => {
  try {
    let data: any;
    let message: string = "";
    if (position === "purchaser" && userId) {
      data = await getDashboardStats(userId);
      message = "Purchaser Dashboard Stats Fetched!";
    }
    return {
      success: true,
      data: data,
      message: message,
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const getPendingRequest = async (
  position: "purchaser" | "admin",
  userId?: number,
) => {
  try {
    let data: any;
    let message: string = "";
    if (position === "purchaser" && userId) {
      data = await findPendingRequestByUserId(userId);
      message = "Pending Request Stats Fetched!";
    }
    return {
      success: true,
      data: data,
      message: message,
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const getOwnerDashboardStats = async () => {
  try {
    const data = await getOwnerDashboardServices.getTotalMetrics();
    return {
      success: true,
      data: data,
      message: "Owner Dashboard Stats Fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const getOwnerRecentStoreSales = async () => {
  try {
    const data = await getOwnerDashboardServices.getRecentStoreSales();
    return {
      success: true,
      data: data,
      message: "Owner Recent Store Sales Fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const getOwnerSalesChartData = async (year: string) => {
  try {
    const data = await getOwnerDashboardServices.getSalesChartData({ year });
    return {
      success: true,
      data: data,
      message: "Owner Sales Chart Data Fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const getOwnerPurchaseOrderChartData = async (year: string) => {
  try {
    const data =
      await getOwnerDashboardServices.getPurchaseOrderChartData(year);
    return {
      success: true,
      data: data,
      message: "Owner Purchase Order Chart Data Fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to fetched",
    };
  }
};

export const StoreDashboardController = async (storeId: number) => {
  try {
    const data = await getStoreDashboard(storeId);
    return { success: true, data: data, message: "Failed to fetched" };
  } catch (e) {
    return { success: false, error: e, message: "Failed to fetched" };
  }
};
