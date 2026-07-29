import {
  selectProductCountVariantForOnline,
  selectProductCountVariants,
  selectProductVariantForOnline,
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

export async function getProductVariantForOnline({
  keyFields = {},
  search,
  category,
  unit,
  sortBy,
  order,
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
  category?: string;
  unit?: string;
  sortBy?: string;
  order?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  connection?: PoolConnection;
  storeId?: number;
  limit?: number;
  offset?: number;
}) {
  try {
    const data = await selectProductVariantForOnline({
      keyFields,
      search,
      category,
      unit,
      sortBy,
      order,
      statusSold,
      from,
      to,
      connection,
      storeId,
      limit,
      offset,
    });

    const total = await selectProductCountVariantForOnline({
      keyFields,
      search,
      category,
      unit,
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
