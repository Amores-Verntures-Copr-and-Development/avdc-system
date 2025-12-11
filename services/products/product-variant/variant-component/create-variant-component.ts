import { CreateVarianComponentDto } from "@/dtos/products.dto";
import { insertVarianComponents } from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";

export async function createVariantComponent({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateVarianComponentDto[];
}) {
  try {
    await insertVarianComponents({ connection, data });
  } catch (e) {
    throw e;
  }
}
