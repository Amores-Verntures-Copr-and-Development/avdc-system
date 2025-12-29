import { selectSalesDiscounts } from "@/models/discountModel";

export const getSalesDiscountServices = {
  findSalesDiscountByStoreId: async ({ storeId }: { storeId: number }) => {
    try {
      const data = await selectSalesDiscounts({
        keyFields: {
          storeId: storeId,
        },
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
