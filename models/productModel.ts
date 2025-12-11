import {
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import { Products } from "@/types/products";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertProducts = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO Products(prodName,storeId,prodCreatedBy,prodCatId)
                VALUES (?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.prodName,
    data.storeId,
    data.prodCreatedBy,
    data.prodCatId,
  ]);
  return results.insertId;
};

export const insertProductVariants = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  console.log({ data });
  const sql = `INSERT INTO ProductVariants(prodVarName,prodVarPrice,prodVarCreatedBy,prodId)
                VALUES ${data.map(() => "(?,?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.prodVarName,
    item.prodVarPrice,
    item.prodVarCreatedAt,
    item.prodId,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const insertVarianComponents = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateVarianComponentDto[];
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  console.log({ data });
  const sql = `INSERT INTO VariantComponents(quantityRequired,prodVarId,inventoryItemId)
                VALUES ${data.map(() => "(?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.quantityRequired,
    item.prodVarId,
    item.inventoryItemId,
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
