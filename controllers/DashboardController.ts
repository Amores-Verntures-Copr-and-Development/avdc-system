import { getDashboardStats } from "@/services/dashboard/purchaser/get-dashboard-stats";

export const getDashboardStatsByRole = async (
  position: "purchaser" | "admin"
) => {
  try {
    let data: any;
    let message: string = "";
    if (position === "purchaser") {
      data = await getDashboardStats();
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
