import { selectPaymentMethods } from "@/models/paymentMethod";

export const getPaymentMethodServices = {
  findPaymentMethodByStoreId: async ({ number }: { number: number }) => {
    try {
      const data = await selectPaymentMethods({
        keyFields: { storeId: number },
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
