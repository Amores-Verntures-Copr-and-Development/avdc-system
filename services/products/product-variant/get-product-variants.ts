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
  storeId,
}: {
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  connection?: PoolConnection;
  storeId?: number;
}) {
  try {
    const data = await selectProductVariants({
      keyFields,
      search,
      statusSold,
      from,
      to,
      connection,
      storeId,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
