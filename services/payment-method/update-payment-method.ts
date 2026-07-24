import { UpdatePaymentMethodDto } from "@/dtos/paymentMethods.dto";
import { updatePaymentMethods } from "@/models/paymentMethod";
import { PoolConnection } from "mysql2/promise";

export const updatePaymentMethodServices = {
  updatePaymentMethod: async ({
    connection,
    data,
  }: {
    connection?: PoolConnection;
    data: UpdatePaymentMethodDto;
  }) => {
    try {
      const result = await updatePaymentMethods({
        connection,
        updates: [data],
        keyFields: ["payMetId"],
      });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
