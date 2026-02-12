import { selectPaymentMethods } from "@/models/paymentMethod";
import { PaymentMethods } from "@/types/payment-methods";
import { PoolConnection } from "mysql2/promise";

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
  findPaymentMethodByKeyFields: async ({
    connection,
    keyFields = {},
    search,
  }: {
    connection?: PoolConnection;
    keyFields?: Partial<PaymentMethods>;
    search?: string;
  }) => {
    try {
      const data = await selectPaymentMethods({
        keyFields,
        connection,
        search,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
  findUniquePaymentMethodByKeyFields: async ({
    connection,
    keyFields = {},
    search,
  }: {
    connection?: PoolConnection;
    keyFields?: Partial<PaymentMethods>;
    search?: string;
  }) => {
    try {
      const data = await selectPaymentMethods({
        keyFields,
        connection,
        search,
      });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
