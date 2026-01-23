import { updateProducts } from "@/models/productModel";
import { Products } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export async function updateProductsByFields({
  connection,
  updates,
  keyFields = ["prodId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<Products>[];
  keyFields?: (keyof Products)[];
}) {
  try {
    const res = await updateProducts({ connection, updates, keyFields });
    return res;
  } catch (e) {
    throw e;
  }
}
