import {
  CreateProductDtos,
  CreateProductVariantDto,
} from "@/dtos/products.dto";
import { createProducts } from "./create-products";
import { getDBConnection } from "@/lib/db";

export async function processAddProducts(data: CreateProductDtos) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //Generate Product Code to each items

    //Insert to Products

    const prodId: number = await createProducts({ data: data, connection });
    const productVariant: CreateProductVariantDto[] =
      data.productVariants?.map((prodVar) => ({
        ...prodVar,
        prodId: prodId,
      })) ?? [];

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
