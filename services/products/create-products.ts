import { CreateProductDtos } from "@/dtos/products.dto";
import { insertProducts } from "@/models/productModel";
import { PoolConnection } from "mysql2/promise";

export async function createProducts({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos;
}) {
  try {
    const id = await insertProducts({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}
