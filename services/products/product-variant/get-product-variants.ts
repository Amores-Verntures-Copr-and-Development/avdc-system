import { selectProductVariants } from "@/models/productModel";
import { ProductVariants } from "@/types/products";

export async function getProductVariants({
  keyFields = {},
  search,
  statusSold,
  from,
  to,
}: {
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
}) {
  try {
    const data = await selectProductVariants({
      keyFields,
      search,
      statusSold,
      from,
      to,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
