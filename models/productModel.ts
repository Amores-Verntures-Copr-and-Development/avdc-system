import {
  CreateProductCategoryDto,
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import { Products, ProductVariants } from "@/types/products";
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

export const insertProductVariant = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ProductVariants(prodVarName,prodVarPrice,prodVarCreatedBy,prodId,isDeductInv)
                VALUES(?,?,?,?,?)`;

  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.prodVarName,
    data.prodVarPrice,
    data.prodVarCreatedBy,
    data.prodId,
    data.isDeductInv,
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
  const sql = `INSERT INTO ProductVariants(prodVarName,prodVarPrice,prodVarCreatedBy,prodId,isDeductInv)
                VALUES ${data.map(() => "(?,?,?,?,?)").join(",")}`;

  const values = data.flatMap((item) => [
    item.prodVarName,
    item.prodVarPrice,
    item.prodVarCreatedBy,
    item.prodId,
    item.isDeductInv,
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
  storeName,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT 
    p.*,
    s.*,
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'prodVarId', pv.prodVarId,
          'prodVarName', pv.prodVarName,
          'prodVarPrice', pv.prodVarPrice,
          'isDeductInv',pv.isDeductInv,
          'sold', (
                      SELECT COALESCE(SUM(si.salesItemQuantity), 0)
                      FROM SalesItems si
                      WHERE si.prodVarId = pv.prodVarId
                    ),
          'variantComponents',
            (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'varComId', vc.varComId,
                  'prodVarId', vc.prodVarId,
                  'quantityRequired', vc.quantityRequired,
                  'inventoryItemId', vc.inventoryItemId,
                  'left', ii.inventoryItemQuantity
                  
                )
              )
              FROM VariantComponents vc
              LEFT JOIN InventoryItems ii ON ii.inventoryItemId = vc.inventoryItemId
              WHERE vc.prodVarId = pv.prodVarId
              
            )
        )
      )
      FROM ProductVariants pv
      WHERE pv.prodId = p.prodId
    ) AS productVariants
  FROM Products p
  LEFT JOIN Stores s ON s.storeId = p.storeId
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
  if (search) {
    sql += ` AND p.prodName LIKE ?`;
    params.push(`%${search}%`);
  }
  if (storeName) {
    sql += ` AND s.storeName LIKE ?`;
    params.push(`%${storeName}%`);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectProductVariants = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT pv.*,u.userName,u.userFname,u.userRole FROM ProductVariants pv
LEFT JOIN Users u ON u.userId = pv.prodVarCreatedBy
  WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const insertProductCategories = async ({
  data,
  connection,
}: {
  data: CreateProductCategoryDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  if (!data.length) return 0;
  console.log({ data });
  const sql = `INSERT INTO ProductCategories(prodCatName,prodCatCreatedBy,storeId)
                VALUES ${data.map(() => "(?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.prodCatName,
    item.prodCatCreatedBy,
    item.storeId,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results;
};
