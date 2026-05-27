import { selectProductCounts, selectProducts } from "@/models/productModel";
import { Products } from "@/types/products";

export async function getProducts({
  keyFields = {},
  search,
  storeName,
  limit,
  offset,
}: {
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await selectProducts({
      keyFields,
      search,
      storeName,
      limit,
      offset,
    });

    const total = await selectProductCounts({ keyFields, search, storeName });
    return {
      data: data,
      total: total[0].totalItems,
    };
  } catch (e) {
    throw e;
  }
}

export async function getProductCounts({
  keyFields = {},
  search,
  storeName,
}: {
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
}) {
  try {
    const data = await selectProducts({ keyFields, search, storeName });
    return data;
  } catch (e) {
    throw e;
  }
}
