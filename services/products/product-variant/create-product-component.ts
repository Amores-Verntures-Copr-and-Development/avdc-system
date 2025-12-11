import { CreateProductVariantDto } from "@/dtos/products.dto";
import { insertProductVariants } from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";

export async function createProductVariants({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto[];
}) {
  try {
    await insertProductVariants({ connection, data });
  } catch (e) {
    throw e;
  }
}
