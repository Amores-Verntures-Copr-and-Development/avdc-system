import { updateProductCategories } from "@/models/productModel";
import { ProductCategories } from "@/types/products";
import { PoolConnection } from "mysql2/promise";

export async function updateProductCategoriesByFields({
  connection,
  updates,
  keyFields = ["prodCatId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ProductCategories>[];
  keyFields?: (keyof ProductCategories)[];
}) {
  try {
    const res = await updateProductCategories({
      connection,
      updates,
      keyFields,
    });
    return res;
  } catch (e) {
    throw e;
  }
}
