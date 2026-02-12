import { updateProducts } from "@/models/productModel";
import { Products } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export async function deleteProducts({
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
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data: Partial<Products>[] = updates.map((i) => ({
      ...i,
      prodDeletedAt: now,
    }));

    await updateProducts({ connection, updates: data, keyFields });
  } catch (e) {
    throw e;
  }
}
