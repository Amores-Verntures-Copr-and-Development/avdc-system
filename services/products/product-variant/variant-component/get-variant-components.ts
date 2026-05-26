import { selectVariantComponents } from "@/models/productModel";
import { VariantComponents } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export async function getVariantComponents({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Record<keyof VariantComponents, any>>;
  connection?: PoolConnection;
}) {
  try {
    const data = await selectVariantComponents({ keyFields, connection });
    return data;
  } catch (e) {
    throw e;
  }
}
