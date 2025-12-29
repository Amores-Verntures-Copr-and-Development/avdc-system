import { CreatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { insertPaymentMethod } from "@/models/paymentMethod";
import { PoolConnection } from "mysql2/promise";

export const createPaymentMethodSevices = {
  createPaymentMethod: async ({
    connection,
    data,
  }: {
    connection?: PoolConnection;
    data: CreatePaymentMethodDto;
  }) => {
    try {
      const result = await insertPaymentMethod({ connection, data });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
