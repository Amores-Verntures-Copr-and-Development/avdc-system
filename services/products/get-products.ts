import { selectProducts } from "@/models/productModel";
import { Products } from "@/types/products";

export async function getProducts({
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
