import {
  CreateProductCategoryDto,
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import {
  ProductCategories,
  Products,
  ProductVariants,
  VariantComponents,
} from "@/types/products";
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
    data.prodCatId || null,
  ]);
  return results.insertId;
};

export const insertProductsBulk = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductDtos[];
}): Promise<number[]> => {
  if (!data.length) return [];

  const pool = connection ? connection : await getDBConnection();

  // Prepare values for bulk insert
  const values: any[] = [];
  const placeholders = data
    .map((d) => {
      values.push(
        d.prodName,
        d.storeId ?? null,
        d.prodCreatedBy,
        d.prodCatId ?? null,
      );
      return "(?,?,?,?)";
    })
    .join(",");

  const sql = `INSERT INTO Products (prodName, storeId, prodCreatedBy, prodCatId)
               VALUES ${placeholders}`;

  const [result] = await pool.execute<ResultSetHeader>(sql, values);

  // Calculate all inserted IDs
  const insertedIds: number[] = [];
  const firstId = result.insertId;
  for (let i = 0; i < result.affectedRows; i++) {
    insertedIds.push(firstId + i);
  }

  return insertedIds;
};

export const updateProducts = async ({
  connection,
  updates,
  keyFields = ["prodId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Products>[];
  keyFields?: (keyof Products)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Products),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE Products
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};
export const insertProductVariant = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ProductVariants(prodVarName,prodVarPrice,prodVarCreatedBy,prodId,isDeductInv,inventoryItemId)
                VALUES(?,?,?,?,?,?)`;

  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.prodVarName,
    data.prodVarPrice,
    data.prodVarCreatedBy,
    data.prodId,
    data.isDeductInv,
    data.inventoryItemId ?? null,
  ]);
  return results.insertId;
};
export const insertProductVariantsBulk = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateProductVariantDto[];
}): Promise<number[]> => {
  if (!data.length) return [];

  const pool = connection ? connection : await getDBConnection();

  // Build bulk insert query
  const placeholders = data.map(() => "(?,?,?,?,?,?)").join(",");
  const values = data.flatMap((item) => [
    item.prodVarName,
    item.prodVarPrice,
    item.prodVarCreatedBy,
    item.prodId,
    item.isDeductInv,
    item.inventoryItemId,
  ]);
  const sql = `
    INSERT INTO ProductVariants
      (prodVarName, prodVarPrice, prodVarCreatedBy, prodId, isDeductInv,inventoryItemId)
    VALUES ${placeholders}
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, values);

  // Calculate all inserted IDs
  const insertedIds: number[] = [];
  const firstId = result.insertId;
  for (let i = 0; i < result.affectedRows; i++) {
    insertedIds.push(firstId + i);
  }
  return insertedIds;
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

  const sql = `INSERT INTO VariantComponents(quantityRequired,prodVarId,inventoryItemId,isDeductVar)
                VALUES ${data.map(() => "(?,?,?,?)").join(",")}`;
  const values = data.flatMap((item) => [
    item.quantityRequired,
    item.prodVarId,
    item.inventoryItemId,
    item.isDeductVar,
  ]);
  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results.insertId;
};

export const selectProductModelOnly = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Products>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM Products WHERE 1=1 AND prodDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as Products[];
};

export const selectProducts = async ({
  connection,
  keyFields = {},
  search,
  storeName,
  limit,
  offset,
  barcode,
  category,
  isPos = false,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
  category?: string;
  unit?: string;
  limit?: number;
  offset?: number;
  barcode?: string;
  isPos?: boolean;
}) => {
  const pool = connection ?? (await getDBConnection());

  let sql = `
    SELECT
      p.*,
      s.*,
      pc.prodCatId,
      pc.prodCatName,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'prodVarId', pv.prodVarId,
            'prodVarName', pv.prodVarName,
            'prodVarPrice', pv.prodVarPrice,
            'isDeductInv', pv.isDeductInv,
            'stocks', iis.inventoryItemQuantity,
            'inventoryItemId', pv.inventoryItemId,
            'barcode', pb.barcode,
            'barcodeId', pb.barcodeId,
            'prodVarImage', pv.prodVarImage,
            'sold', (
              SELECT COALESCE(SUM(si.salesItemQuantity), 0)
              FROM SalesItems si
              WHERE si.prodVarId = pv.prodVarId
            ),
            'variantComponents', (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'varComId', vc.varComId,
                  'prodVarId', vc.prodVarId,
                  'quantityRequired', vc.quantityRequired,
                  'inventoryItemId', vc.inventoryItemId,
                  'left', ii.inventoryItemQuantity,
                  'isDeductVar', vc.isDeductVar
                )
              )
              FROM VariantComponents vc
              LEFT JOIN InventoryItems ii
                ON ii.inventoryItemId = vc.inventoryItemId
              WHERE vc.prodVarId = pv.prodVarId
            )
          )
        )
        FROM ProductVariants pv
        LEFT JOIN InventoryItems iis
          ON iis.inventoryItemId = pv.inventoryItemId
        LEFT JOIN Barcodes pb
          ON pb.prodVarId = pv.prodVarId
        WHERE pv.prodId = p.prodId
          AND pv.prodVarDeletedAt IS NULL
      ) AS productVariants
    FROM Products p
    LEFT JOIN Stores s
      ON s.storeId = p.storeId
    LEFT JOIN ProductCategories pc
      ON pc.prodCatId = p.prodCatId
    WHERE p.prodDeletedAt IS NULL
  `;

  const params: any[] = [];

  // Dynamic key fields
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND p.${key} IS NULL`;
    } else {
      sql += ` AND p.${key} = ?`;
      params.push(value);
    }
  }

  // Search by product name OR barcode
  if (search?.trim()) {
    sql += `
    AND (
      p.prodName LIKE ?
      OR EXISTS (
        SELECT 1
        FROM ProductVariants pvs
        LEFT JOIN Barcodes bc
          ON bc.prodVarId = pvs.prodVarId
        WHERE pvs.prodId = p.prodId
          AND pvs.prodVarDeletedAt IS NULL
          AND (
            pvs.prodVarName LIKE ?
            OR bc.barcode LIKE ?
          )
      )
    )
  `;

    params.push(
      `%${search.trim()}%`,
      `%${search.trim()}%`,
      `%${search.trim()}%`,
    );
  }

  // Store filter
  if (storeName?.trim()) {
    sql += ` AND s.storeName LIKE ?`;
    params.push(`%${storeName.trim()}%`);
  }

  // Exact barcode filter
  if (barcode?.trim()) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM ProductVariants pvs
        LEFT JOIN Barcodes bc
          ON bc.prodVarId = pvs.prodVarId
        WHERE pvs.prodId = p.prodId
          AND bc.barcode = ?
      )
    `;

    params.push(barcode.trim());
  }

  // Category filter
  if (category?.trim() && category !== "all") {
    if (category === "null") {
      sql += ` AND pc.prodCatName IS NULL`;
    } else {
      sql += ` AND TRIM(pc.prodCatName) = TRIM(?)`;
      params.push(category.trim());
    }
  }

  if (isPos) {
    sql += `
    ORDER BY
      EXISTS (
        SELECT 1
        FROM ProductVariants pv2
        LEFT JOIN InventoryItems ii2
          ON ii2.inventoryItemId = pv2.inventoryItemId
        WHERE pv2.prodId = p.prodId
          AND pv2.prodVarDeletedAt IS NULL
          AND COALESCE(ii2.inventoryItemQuantity, 0) > 0
      ) DESC,
      p.prodName ASC
  `;
  } else {
    sql += ` ORDER BY p.prodName ASC`;
  }

  // Pagination
  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }

  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectProductCounts = async ({
  connection,
  keyFields = {},
  search,
  storeName,
  barcode,
  category,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Products>;
  search?: string;
  storeName?: string;
  category?: string;
  unit?: string;
  barcode?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT  
    COUNT(DISTINCT p.prodId) as totalItems
FROM Products p
LEFT JOIN Stores s 
  ON s.storeId = p.storeId
LEFT JOIN ProductCategories pc 
  ON pc.prodCatId = p.prodCatId
WHERE p.prodDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND p.${key} IS NULL`;
    } else {
      sql += ` AND p.${key} = ?`;
      params.push(value);
    }
  }
  if (search?.trim()) {
    sql += `
    AND (
      p.prodName LIKE ?
      OR EXISTS (
        SELECT 1
        FROM ProductVariants pvs
        LEFT JOIN Barcodes bc
          ON bc.prodVarId = pvs.prodVarId
        WHERE pvs.prodId = p.prodId
          AND pvs.prodVarDeletedAt IS NULL
          AND (
            pvs.prodVarName LIKE ?
            OR bc.barcode LIKE ?
          )
      )
    )
  `;

    params.push(
      `%${search.trim()}%`,
      `%${search.trim()}%`,
      `%${search.trim()}%`,
    );
  }
  if (storeName?.trim()) {
    sql += ` AND s.storeName LIKE ?`;
    params.push(`%${storeName.trim()}%`);
  }
  if (barcode?.trim()) {
    sql += `
      AND EXISTS (
        SELECT 1
        FROM ProductVariants pvs
        LEFT JOIN Barcodes bc
          ON bc.prodVarId = pvs.prodVarId
        WHERE pvs.prodId = p.prodId
          AND bc.barcode = ?
      )
    `;

    params.push(barcode.trim());
  }
  if (category?.trim() && category !== "all") {
    if (category === "null") {
      sql += ` AND pc.prodCatName IS NULL`;
    } else {
      sql += ` AND TRIM(pc.prodCatName) = TRIM(?)`;
      params.push(category.trim());
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows;
};

export const selectProductVariants = async ({
  connection,
  keyFields = {},
  statusSold,
  from,
  to,
  storeId,
  search,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  storeId?: number;
  limit?: number;
  offset?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT 
    pv.*,
    p.prodName,
    u.userName,
    u.userFname,
    b.barcodeId,
    b.barcode,
    iis.inventoryItemQuantity,
    (SELECT SUM(si.salesItemQuantity) 
     FROM SalesItems si 
     WHERE si.prodVarId = pv.prodVarId) AS sold,
    (SELECT SUM(si.salesItemSubtotal) 
     FROM SalesItems si 
     WHERE si.prodVarId = pv.prodVarId) AS totalSales,
    (
      SELECT JSON_ARRAYAGG(
        JSON_OBJECT(
          'itemName', i.itemName,
          'itemId', i.itemId,
          'varComId', vc.varComId,
          'quantityRequired', vc.quantityRequired,
          'inventoryItemId', vc.inventoryItemId,
          'prodVarId', vc.prodVarId,
          'itemUnit', i.itemUnit,
          'isDeductVar',vc.isDeductVar,
          'itemPrice',i.itemPrice
        )
      )
      FROM VariantComponents vc
      LEFT JOIN InventoryItems ii 
             ON ii.inventoryItemId = vc.inventoryItemId 
             AND ii.inventoryItemReferenceType = 'item'
      LEFT JOIN Items i 
             ON i.itemId = ii.inventoryItemReferenceId
      WHERE vc.prodVarId = pv.prodVarId
    ) AS variantComponents,
        COALESCE(
      CASE 
        WHEN pv.inventoryItemId IS NOT NULL THEN i.itemPrice
        ELSE (
          SELECT SUM(COALESCE(ci.itemPrice, 0) * COALESCE(vc.quantityRequired, 0))
          FROM VariantComponents vc
          LEFT JOIN InventoryItems cii 
                 ON cii.inventoryItemId = vc.inventoryItemId
                 AND cii.inventoryItemReferenceType = 'item'
          LEFT JOIN Items ci 
                 ON ci.itemId = cii.inventoryItemReferenceId
          WHERE vc.prodVarId = pv.prodVarId
            AND vc.isDeductVar = 1
        )
      END,
      0
    ) AS totalCost,

    (
      COALESCE(pv.prodVarPrice, 0) -
      COALESCE(
        CASE 
          WHEN pv.inventoryItemId IS NOT NULL THEN i.itemPrice
          ELSE (
            SELECT SUM(COALESCE(ci.itemPrice, 0) * COALESCE(vc.quantityRequired, 0))
            FROM VariantComponents vc
            LEFT JOIN InventoryItems cii 
                   ON cii.inventoryItemId = vc.inventoryItemId
                   AND cii.inventoryItemReferenceType = 'item'
            LEFT JOIN Items ci 
                   ON ci.itemId = cii.inventoryItemReferenceId
            WHERE vc.prodVarId = pv.prodVarId
              AND vc.isDeductVar = 1
          )
        END,
        0
      )
    ) AS profit,

    CASE
      WHEN COALESCE(pv.prodVarPrice, 0) = 0 THEN 0
      ELSE ROUND(
        (
          (
            COALESCE(pv.prodVarPrice, 0) -
            COALESCE(
              CASE 
                WHEN pv.inventoryItemId IS NOT NULL THEN i.itemPrice
                ELSE (
                  SELECT SUM(COALESCE(ci.itemPrice, 0) * COALESCE(vc.quantityRequired, 0))
                  FROM VariantComponents vc
                  LEFT JOIN InventoryItems cii 
                         ON cii.inventoryItemId = vc.inventoryItemId
                         AND cii.inventoryItemReferenceType = 'item'
                  LEFT JOIN Items ci 
                         ON ci.itemId = cii.inventoryItemReferenceId
                  WHERE vc.prodVarId = pv.prodVarId
                    AND vc.isDeductVar = 1
                )
              END,
              0
            )
          ) / COALESCE(pv.prodVarPrice, 0)
        ) * 100,
        2
      )
    END AS profitPercentage
FROM ProductVariants pv
LEFT JOIN Users u ON u.userId = pv.prodVarCreatedBy
LEFT JOIN Products p ON p.prodId = pv.prodId
LEFT JOIN InventoryItems iis ON iis.inventoryItemId = pv.inventoryItemId
LEFT JOIN Items i ON i.itemId = iis.inventoryItemReferenceId AND iis.inventoryItemReferenceType = 'item'
LEFT JOIN Barcodes b ON b.prodVarId = pv.prodVarId
WHERE 1=1 AND pv.prodVarDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }
  if (storeId) {
    sql += ` AND p.storeId = ?`;
    params.push(storeId);
  }
  if (search?.trim()) {
    const keyword = `%${search.trim()}%`;

    sql += `
    AND (
      p.prodName LIKE ?
      OR pv.prodVarName LIKE ?
      OR b.barcode LIKE ?
    )
  `;

    params.push(keyword, keyword, keyword);
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset) {
    sql += ` OFFSET ${offset}`;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectProductVariantForOnline = async ({
  connection,
  keyFields = {},
  statusSold,
  from,
  to,
  storeId,
  search,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  storeId?: number;
  limit?: number;
  offset?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `
SELECT
pv.prodId,
pv.prodVarName,
pv.prodVarUnit,
pv.prodVarPrice,
pv.prodVarId,
    p.prodName,
    iis.inventoryItemQuantity
FROM ProductVariants pv
LEFT JOIN Products p ON p.prodId = pv.prodId
LEFT JOIN InventoryItems iis ON iis.inventoryItemId = pv.inventoryItemId
WHERE 1=1 AND pv.prodVarDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }
  if (storeId) {
    sql += ` AND p.storeId = ?`;
    params.push(storeId);
  }
  if (search?.trim()) {
    const keyword = `%${search.trim()}%`;

    sql += `
    AND (
      p.prodName LIKE ?
      OR pv.prodVarName LIKE ?
      OR b.barcode LIKE ?
    )
  `;

    params.push(keyword, keyword, keyword);
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset) {
    sql += ` OFFSET ${offset}`;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectProductCountVariantForOnline = async ({
  connection,
  keyFields = {},
  statusSold,
  from,
  to,
  storeId,
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  storeId?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `
SELECT 
    COUNT(pv.prodVarId) as totalItems
FROM ProductVariants pv
LEFT JOIN Users u ON u.userId = pv.prodVarCreatedBy
LEFT JOIN Products p ON p.prodId = pv.prodId
LEFT JOIN InventoryItems iis ON iis.inventoryItemId = pv.inventoryItemId
LEFT JOIN Barcodes b ON b.prodVarId = pv.prodVarId
WHERE 1=1 AND pv.prodVarDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }
  if (storeId) {
    sql += ` AND p.storeId = ?`;
    params.push(storeId);
  }
  if (search?.trim()) {
    const keyword = `%${search.trim()}%`;

    sql += `
    AND (
      p.prodName LIKE ?
      OR pv.prodVarName LIKE ?
      OR b.barcode LIKE ?
    )
  `;

    params.push(keyword, keyword, keyword);
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0].totalItems;
};

export const selectProductCountVariants = async ({
  connection,
  keyFields = {},
  statusSold,
  from,
  to,
  storeId,
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  statusSold?: "fast" | "slow" | null;
  from?: string;
  to?: string;
  storeId?: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `
SELECT 
    COUNT(pv.prodVarId) as totalItems
FROM ProductVariants pv
LEFT JOIN Users u ON u.userId = pv.prodVarCreatedBy
LEFT JOIN Products p ON p.prodId = pv.prodId
LEFT JOIN InventoryItems iis ON iis.inventoryItemId = pv.inventoryItemId
LEFT JOIN Barcodes b ON b.prodVarId = pv.prodVarId
WHERE 1=1 AND pv.prodVarDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }
  if (storeId) {
    sql += ` AND p.storeId = ?`;
    params.push(storeId);
  }
  if (search?.trim()) {
    const keyword = `%${search.trim()}%`;

    sql += `
    AND (
      p.prodName LIKE ?
      OR pv.prodVarName LIKE ?
      OR b.barcode LIKE ?
    )
  `;

    params.push(keyword, keyword, keyword);
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0].totalItems;
};

export const selectProductVariantsTable = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<ProductVariants>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = ` SELECT * FROM ProductVariants pv
  WHERE 1=1 AND pv.prodVarDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pv.${key} IS NULL`;
    } else {
      sql += ` AND pv.${key} = ?`;
      params.push(value);
    }
  }
  console.log({ sql, params });
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as ProductVariants[];
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

export const selectProductCategories = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<ProductCategories>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = ` SELECT * FROM ProductCategories pc
  WHERE 1=1 AND pc.prodCatDeletedAt IS NULL`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND pc.${key} IS NULL`;
    } else {
      sql += ` AND pc.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const updateProductVariants = async ({
  connection,
  updates,
  keyFields = ["prodVarId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ProductVariants>[];
  keyFields?: (keyof ProductVariants)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ProductVariants),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE ProductVariants
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};
export const updateProductCategories = async ({
  connection,
  updates,
  keyFields = ["prodCatId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<ProductCategories>[];
  keyFields?: (keyof ProductCategories)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ProductCategories),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE ProductCategories
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const updateVariantComponents = async ({
  connection,
  updates,
  keyFields = ["varComId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<VariantComponents>[];
  keyFields?: (keyof VariantComponents)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof VariantComponents),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // Build SET clauses for each field to update
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add key values + update value
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    // Build the CASE statement for this field and add to setClauses
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " ",
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE VariantComponents
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const hardDeleteVariantComponents = async ({
  connection,
  updates,
  keyFields = ["varComId"],
}: {
  connection?: PoolConnection;
  updates: Partial<VariantComponents>[];
  keyFields?: (keyof VariantComponents)[];
}) => {
  if (!updates || updates.length === 0) return;

  const pool = connection ?? (await getDBConnection());

  // Build WHERE clause
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  const params: any[] = [];

  let whereSql: string;

  if (keyFields.length === 1) {
    // Single key
    whereSql = `${keyFields[0]} IN (${uniqueKeyCombinations
      .map(() => "?")
      .join(",")})`;
    uniqueKeyCombinations.forEach((vals) => params.push(vals[0]));
  } else {
    // Composite key
    whereSql = `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
      .map((vals) => `(${vals.map(() => "?").join(",")})`)
      .join(",")})`;
    uniqueKeyCombinations.forEach((vals) => params.push(...vals));
  }

  // Execute delete
  const sql = `DELETE FROM VariantComponents WHERE ${whereSql};`;
  const [result] = await pool.execute(sql, params);

  return result;
};

export const selectVariantComponents = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof VariantComponents, any>>;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT * FROM VariantComponents WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as VariantComponents[];
};
