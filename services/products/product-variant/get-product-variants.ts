import {
  selectProductCountVariants,
  selectProductVariants,
} from "@/models/productModel";
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
  limit,
  offset,
}: {
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  connection?: PoolConnection;
  storeId?: number;
  limit?: number;
  offset?: number;
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
      limit,
      offset,
    });

    const total = await selectProductCountVariants({
      keyFields,
      search,
      statusSold,
      from,
      to,
      connection,
      storeId,
    });
    return {
      data: data,
      total: total,
    };
  } catch (e) {
    throw e;
  }
}
