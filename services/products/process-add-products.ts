import { CreateProductDtos } from "@/dtos/products.dto";
import { createProducts } from "./create-products";
import { getDBConnection } from "@/lib/db";

export async function processAddProducts(data: CreateProductDtos[]) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    //Generate Product Code to each items
    const newData: CreateProductDtos[] = data.map((prod) => ({
      ...prod,
      productCode: `PROD-${prod.inventoryItemId}`,
    }));
    //Insert to Products

    await createProducts({ data: newData, connection });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
