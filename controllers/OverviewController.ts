import { getOverview } from "@/services/overview/get-overview";

export const OverviewController = {
  get: async ({
    trend = "days",
    from,
    to,
  }: {
    trend?: "year" | "month" | "weeks" | "days";
    from?: string;
    to?: string;
  }) => {
    try {
      const res = await getOverview({ trend, from, to });

      return {
        success: true,
        message: "Success",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },
};
