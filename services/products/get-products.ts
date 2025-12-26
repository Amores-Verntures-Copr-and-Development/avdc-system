import { selectProducts } from "@/models/productModel";
import { Products } from "@/types/products";

export async function getProducts({
  keyFields = {},
  search,
}: {
  keyFields?: Partial<Products>;
  search?: string;
}) {
  try {
    const data = await selectProducts({ keyFields, search });
    return data;
  } catch (e) {
    throw e;
  }
}
