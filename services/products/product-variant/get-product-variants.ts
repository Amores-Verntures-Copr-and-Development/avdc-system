import { selectProductVariants } from "@/models/productModel";
import { ProductVariants } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export async function getProductVariants({
  keyFields = {},
  search,
  statusSold,
  from,
  to,
  connection,
}: {
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  connection?: PoolConnection;
}) {
  try {
    const data = await selectProductVariants({
      keyFields,
      search,
      statusSold,
      from,
      to,
      connection,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
