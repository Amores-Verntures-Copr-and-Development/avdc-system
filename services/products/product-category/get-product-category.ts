import { selectProductCategories } from "@/models/productModel";
import { ProductCategories } from "@/types/products";

export const getProductCategoryServices = {
  findProductCategoriesByFields: async ({
    keyFields = {},
  }: {
    keyFields?: Partial<ProductCategories>;
  }) => {
    try {
      const data = await selectProductCategories({ keyFields });
      return data;
    } catch (e) {
      throw e;
    }
  },
};
