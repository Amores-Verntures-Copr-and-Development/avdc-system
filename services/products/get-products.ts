import { selectProductCounts, selectProducts } from "@/models/productModel";
import { Products } from "@/types/products";

export async function getProducts({
  keyFields = {},
  search,
  storeName,
  limit,
  offset,
  barcode,
  category,
  isPos,
}: {
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  barcode?: string;
  isPos?: boolean;
}) {
  try {
    const data = await selectProducts({
      keyFields,
      search,
      storeName,
      limit,
      offset,
      barcode,
      category,
      isPos,
    });

    const total = await selectProductCounts({
      keyFields,
      search,
      storeName,
      barcode,
      category,
    });
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
  isPos?: boolean;
}) {
  try {
    const data = await selectProducts({ keyFields, search, storeName });
    return data;
  } catch (e) {
    throw e;
  }
}
