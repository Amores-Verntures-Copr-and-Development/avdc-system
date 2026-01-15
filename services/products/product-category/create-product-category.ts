import { CreateProductCategoryDto } from "@/dtos/products.dto";
import { insertProductCategories } from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";

export async function createProductCategory({
  data,
  connection,
}: {
  data: CreateProductCategoryDto[];
  connection?: PoolConnection;
}) {
  try {
    const result = await insertProductCategories({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
