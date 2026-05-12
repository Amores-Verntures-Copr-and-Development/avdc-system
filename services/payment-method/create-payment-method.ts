import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { insertPaymentMethod } from "@/models/paymentMethod";
import { PoolConnection } from "mysql2/promise";
import { getPaymentMethodServices } from "./get-payment-method";

export const createPaymentMethodSevices = {
  createPaymentMethod: async ({
    connection,
    data,
  }: {
    connection?: PoolConnection;
    data: CreatePaymentMethodDto;
  }) => {
    try {
      const paymentMethods =
        await getPaymentMethodServices.findPaymentMethodLikeNameAndStore({
          connection: connection,
          name: data.payMetName,
          storeId: data.storeId,
        });

      const isExisting = paymentMethods && paymentMethods.length > 0;
      if (isExisting) {
        throw new Error(`Payment method ${data.payMetName} already exists!`);
      }
      const result = await insertPaymentMethod({ connection, data });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
