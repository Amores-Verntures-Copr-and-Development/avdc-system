import {
  findPendingRequestByUserId,
  getDashboardStats,
} from "@/services/dashboard/purchaser/get-dashboard-stats";

export const getDashboardStatsByRole = async (
  position: "purchaser" | "admin",
  userId?: number
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
  userId?: number
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
