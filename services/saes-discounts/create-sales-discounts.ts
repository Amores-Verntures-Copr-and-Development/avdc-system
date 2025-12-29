import { CreateSalesDiscountDto } from "@/dtos/discounts.dto";
import { insertSalesDiscount } from "@/models/discountModel";
import { PoolConnection } from "mysql2/promise";

export const createSalesDiscountServices = {
  createSalesDiscount: async ({
    data,
    connection,
  }: {
    data: CreateSalesDiscountDto;
    connection?: PoolConnection;
  }) => {
    try {
      const result = await insertSalesDiscount({ data, connection });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
