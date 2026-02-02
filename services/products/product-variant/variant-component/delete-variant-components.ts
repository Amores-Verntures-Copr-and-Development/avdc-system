import {
  hardDeleteVariantComponents,
  updateVariantComponents,
} from "@/models/productModel";
import { VariantComponents } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export const deleteVariantComponentServices = {
  hardDeleteVariantComponent: async ({
    connection,
    keyFields = ["varComId"],
    updates,
  }: // 👈 optional per-field mode
  {
    connection?: PoolConnection;
    updates: Partial<VariantComponents>[];
    keyFields?: (keyof VariantComponents)[];
  }) => {
    try {
      const result = await hardDeleteVariantComponents({
        connection,
        keyFields,
        updates,
      });
      return result;
    } catch (e) {
      throw e;
    }
  },
};
