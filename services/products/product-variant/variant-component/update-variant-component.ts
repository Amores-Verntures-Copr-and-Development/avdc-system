import {
  updateProductVariants,
  updateVariantComponents,
} from "@/models/productModel";
import { VariantComponents } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export const updateVariantComponentServices = {
  updateVariantComponentByFields: async ({
    connection,
    updates,
    keyFields = ["varComId"],
  }: // 👈 optional per-field mode
  {
    connection?: PoolConnection;
    updates: Partial<VariantComponents>[];
    keyFields?: (keyof VariantComponents)[];
  }) => {
    try {
      const result = await updateVariantComponents({
        connection,
        updates,
        keyFields,
      });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
