import { getOverview } from "@/services/overview/get-overview";

export const OverviewController = {
  get: async ({
    trend = "days",
    from,
    to,
    notZeroSales,
    storeIds,
  }: {
    trend?: "year" | "month" | "weeks" | "days";
    from?: string;
    to?: string;
    notZeroSales?: boolean;
    storeIds?: number[];
  }) => {
    try {
      const res = await getOverview({
        trend,
        from,
        to,
        notZeroSales,
        storeIds,
      });

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
