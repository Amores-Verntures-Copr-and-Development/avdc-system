import { selectProductVariants } from "@/models/productModel";
import { ProductVariants } from "@/types/products";

export async function getProductVariants({
  keyFields = {},
}: {
  keyFields?: Partial<ProductVariants>;
}) {
  try {
    const data = await selectProductVariants({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}
