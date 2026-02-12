import { ProductVariants } from "@/types/products";
import { PoolConnection } from "mysql2/promise";
import { updateProductVariantServices } from "./update-product-variants";

export async function deleteProductVariants({
  connection,
  updates,
  keyFields = ["prodVarId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ProductVariants>[];
  keyFields?: (keyof ProductVariants)[];
}) {
  try {
    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const data: Partial<ProductVariants>[] = updates.map((i) => ({
      ...i,
      prodVarDeletedAt: now,
    }));

    await updateProductVariantServices.updateProductVariants({
      connection,
      updates: data,
      keyFields,
    });
  } catch (e) {
    throw e;
  }
}
