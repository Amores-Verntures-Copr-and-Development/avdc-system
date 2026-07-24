import {
  selectPaymentMethodByNameAndStore,
  selectPaymentMethods,
} from "@/models/paymentMethod";
import { PaymentMethods } from "@/types/payment-methods";
import { PoolConnection } from "mysql2/promise";

export const getPaymentMethodServices = {
  findPaymentMethodByStoreId: async ({
    number,
    isOnline,
  }: {
    number: number;
    isOnline?: boolean;
  }) => {
    try {
      const data = await selectPaymentMethods({
        keyFields: {
          storeId: number,
          ...(isOnline !== undefined ? { payMetIsOnline: isOnline } : {}),
        },
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
  findPaymentMethodLikeNameAndStore: async ({
    connection,
    name,
    storeId,
  }: {
    connection?: PoolConnection;
    name: string;
    storeId: number;
  }) => {
    return await selectPaymentMethodByNameAndStore({
      connection,
      name: name,
      storeId,
    });
  },
};
