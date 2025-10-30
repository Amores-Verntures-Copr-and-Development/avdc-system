import { CreateProductDtos } from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import { Products } from "@/types/products";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertProducts = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  const sql = `INSERT INTO Products(productCode,productPrice,productDescription,productCreatedBy,inventoryItemId,inventoryId)
                VALUES ${data.map(() => "(?,?,?,?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.productCode,
    item.productPrice,
    item.productDescription,
    item.productCreatedBy,
    item.inventoryItemId,
    item.inventoryId,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const selectProducts = async ({
  connection,
  keyFields = {},
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Products>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM Products p
  LEFT JOIN InventoryItems ii ON ii.inventoryItemId = p.inventoryItemId
  LEFT JOIN Items i ON i.itemId = ii.inventoryItemReferenceId LEFT JOIN Categories c ON c.categoryId = i.categoryId
  WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND p.${key} IS NULL`;
    } else {
      sql += ` AND p.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};
