import {
  CreateProductCategoryDto,
  CreateProductDtos,
  CreateProductVariantDto,
  CreateVarianComponentDto,
} from "@/dtos/products.dto";
import { getDBConnection } from "@/lib/db";
import { assertKnownColumns } from "@/lib/db/assertKnownColumns";
import {
  ProductCategories,
  Products,
  ProductVariants,
  VariantComponents,
} from "@/types/products";
import { buildDailyTrend, growthPct } from "@/utils/trendStats";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

// Column names are interpolated directly into raw SQL below (CASE/WHERE
// builders) - allowlisting against the real table columns prevents a
// crafted request body (e.g. an extra key on an update endpoint's JSON
// body, which is only loosely typed as Partial<X>) from injecting
// arbitrary SQL via an object key.
const PRODUCT_COLUMNS = new Set<keyof Products>([
  "prodId",
  "prodName",
  "prodCreatedAt",
  "prodUpdatedAt",
  "prodDeletedAt",
  "storeId",
  "prodCreatedBy",
  "prodCatId",
]);

const PRODUCT_VARIANT_COLUMNS = new Set<keyof ProductVariants>([
  "prodVarId",
  "prodVarName",
  "prodVarPrice",
  "prodVarPriceOnline",
  "prodVarUnit",
  "isDeductInv",
  "isAvailableOnline",
  "isAvailableKiosk",
  "kioskOrder",
  "inventoryItemId",
  "prodVarCreatedAt",
  "prodVarUpdatedAt",
  "prodVarDeletedAt",
  "prodVarCreatedBy",
  "prodId",
  "prodVarImage",
]);

const PRODUCT_CATEGORY_COLUMNS = new Set<keyof ProductCategories>([
  "prodCatId",
  "prodCatName",
  "prodCatCreatedAt",
  "prodCatUpdatedAt",
  "prodCatDeletedAt",
  "prodCatCreatedBy",
  "storeId",
]);

const VARIANT_COMPONENT_COLUMNS = new Set<keyof VariantComponents>([
  "varComId",
  "quantityRequired",
  "prodVarId",
  "inventoryItemId",
  "isDeductVar",
]);

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

  assertKnownColumns(keyFields, PRODUCT_COLUMNS, "Products");
  assertKnownColumns(Object.keys(updates[0]), PRODUCT_COLUMNS, "Products");

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
            'barcode', (
              SELECT pb.barcode FROM Barcodes pb
              WHERE pb.prodVarId = pv.prodVarId
              ORDER BY pb.barcodeId ASC LIMIT 1
            ),
            'barcodeId', (
              SELECT pb.barcodeId FROM Barcodes pb
              WHERE pb.prodVarId = pv.prodVarId
              ORDER BY pb.barcodeId ASC LIMIT 1
            ),
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

// Powers the Products page KPI cards (Total Products, Total Sold, Total
// Sales, Best Seller) - each with a 14-day trend for its sparkline, and a
// this-month-vs-last-month growth % where that's meaningful.
export const selectProductsDashboardStats = async ({
  storeId,
  storeName,
}: {
  storeId?: number;
  storeName?: string;
}) => {
  const pool = await getDBConnection();

  const productConditions: string[] = ["p.prodDeletedAt IS NULL"];
  const productParams: any[] = [];
  if (storeId) {
    productConditions.push("p.storeId = ?");
    productParams.push(storeId);
  }
  if (storeName?.trim()) {
    productConditions.push("s.storeName LIKE ?");
    productParams.push(`%${storeName.trim()}%`);
  }
  const productWhereClause = `WHERE ${productConditions.join(" AND ")}`;

  // Sold quantity/revenue is scoped through the product's own storeId
  // (Products.storeId), same as the rest of this query, rather than the
  // sale's storeId - keeps this consistent with how "sold" is already
  // computed per-variant in selectProducts above.
  const soldConditions: string[] = ["p.prodDeletedAt IS NULL"];
  const soldParams: any[] = [];
  if (storeId) {
    soldConditions.push("p.storeId = ?");
    soldParams.push(storeId);
  }
  if (storeName?.trim()) {
    soldConditions.push("st.storeName LIKE ?");
    soldParams.push(`%${storeName.trim()}%`);
  }
  const soldWhereClause = `WHERE ${soldConditions.join(" AND ")}`;

  // 1️⃣ Total products (all time)
  const totalProductsSql = `
    SELECT COUNT(DISTINCT p.prodId) AS totalProducts
    FROM Products p
    LEFT JOIN Stores s ON s.storeId = p.storeId
    ${productWhereClause};
  `;

  // 2️⃣ New-products trend (daily count, last 14 days)
  const productsTrendSql = `
    SELECT
      DATE_FORMAT(CONVERT_TZ(p.prodCreatedAt, '+00:00', '+08:00'), '%Y-%m-%d') AS period,
      COUNT(*) AS value
    FROM Products p
    LEFT JOIN Stores s ON s.storeId = p.storeId
    ${productWhereClause}
      AND DATE(CONVERT_TZ(p.prodCreatedAt, '+00:00', '+08:00'))
        >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY period
    ORDER BY period ASC;
  `;

  // 3️⃣ New-products growth (this calendar month vs last calendar month)
  const productsGrowthSql = `
    SELECT
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(p.prodCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE(), '%Y-%m') THEN 1 ELSE 0 END) AS thisMonthCount,
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(p.prodCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN 1 ELSE 0 END) AS lastMonthCount
    FROM Products p
    LEFT JOIN Stores s ON s.storeId = p.storeId
    ${productWhereClause};
  `;

  // 4️⃣ Total units sold + total product revenue (all time)
  const totalSoldSql = `
    SELECT
      COALESCE(SUM(si.salesItemQuantity), 0) AS totalSold,
      COALESCE(SUM(si.salesItemTotal), 0) AS totalSales
    FROM SalesItems si
    JOIN Sales s ON s.salesId = si.salesId
    JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
    JOIN Products p ON p.prodId = pv.prodId
    LEFT JOIN Stores st ON st.storeId = p.storeId
    ${soldWhereClause};
  `;

  // 5️⃣ Units-sold + revenue trend (daily, last 14 days)
  const soldTrendSql = `
    SELECT
      DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m-%d') AS period,
      COALESCE(SUM(si.salesItemQuantity), 0) AS soldValue,
      COALESCE(SUM(si.salesItemTotal), 0) AS salesValue
    FROM SalesItems si
    JOIN Sales s ON s.salesId = si.salesId
    JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
    JOIN Products p ON p.prodId = pv.prodId
    LEFT JOIN Stores st ON st.storeId = p.storeId
    ${soldWhereClause}
      AND DATE(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'))
        >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
    GROUP BY period
    ORDER BY period ASC;
  `;

  // 6️⃣ Units-sold + revenue growth (this calendar month vs last calendar month)
  const soldGrowthSql = `
    SELECT
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE(), '%Y-%m') THEN si.salesItemQuantity ELSE 0 END) AS thisMonthSold,
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN si.salesItemQuantity ELSE 0 END) AS lastMonthSold,
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE(), '%Y-%m') THEN si.salesItemTotal ELSE 0 END) AS thisMonthSales,
      SUM(CASE WHEN DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m')
        = DATE_FORMAT(CURDATE() - INTERVAL 1 MONTH, '%Y-%m') THEN si.salesItemTotal ELSE 0 END) AS lastMonthSales
    FROM SalesItems si
    JOIN Sales s ON s.salesId = si.salesId
    JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
    JOIN Products p ON p.prodId = pv.prodId
    LEFT JOIN Stores st ON st.storeId = p.storeId
    ${soldWhereClause};
  `;

  // 7️⃣ Best seller (highest units sold, all time)
  const bestSellerSql = `
    SELECT p.prodId, p.prodName, COALESCE(SUM(si.salesItemQuantity), 0) AS totalSold
    FROM SalesItems si
    JOIN Sales s ON s.salesId = si.salesId
    JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
    JOIN Products p ON p.prodId = pv.prodId
    LEFT JOIN Stores st ON st.storeId = p.storeId
    ${soldWhereClause}
    GROUP BY p.prodId, p.prodName
    ORDER BY totalSold DESC
    LIMIT 1;
  `;

  const [totalProductsRows] = await pool.query<RowDataPacket[]>(
    totalProductsSql,
    productParams,
  );
  const [productsTrendRows] = await pool.query<RowDataPacket[]>(
    productsTrendSql,
    productParams,
  );
  const [productsGrowthRows] = await pool.query<RowDataPacket[]>(
    productsGrowthSql,
    productParams,
  );
  const [totalSoldRows] = await pool.query<RowDataPacket[]>(
    totalSoldSql,
    soldParams,
  );
  const [soldTrendRows] = await pool.query<RowDataPacket[]>(
    soldTrendSql,
    soldParams,
  );
  const [soldGrowthRows] = await pool.query<RowDataPacket[]>(
    soldGrowthSql,
    soldParams,
  );
  const [bestSellerRows] = await pool.query<RowDataPacket[]>(
    bestSellerSql,
    soldParams,
  );

  const bestSeller = bestSellerRows[0] ?? null;
  let bestSellerTrend: { period: string; value: number }[] = [];
  if (bestSeller) {
    const [bestSellerTrendRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT
        DATE_FORMAT(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'), '%Y-%m-%d') AS period,
        COALESCE(SUM(si.salesItemQuantity), 0) AS value
      FROM SalesItems si
      JOIN Sales s ON s.salesId = si.salesId
      JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
      JOIN Products p ON p.prodId = pv.prodId
      WHERE p.prodId = ?
        AND DATE(CONVERT_TZ(s.salesCreatedAt, '+00:00', '+08:00'))
          >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY period
      ORDER BY period ASC;
      `,
      [bestSeller.prodId],
    );
    bestSellerTrend = buildDailyTrend(bestSellerTrendRows as any[], 14);
  }

  return {
    totalProducts: Number(totalProductsRows[0]?.totalProducts ?? 0),
    productsTrend: buildDailyTrend(productsTrendRows as any[], 14),
    productsGrowthPct: growthPct(
      Number(productsGrowthRows[0]?.thisMonthCount ?? 0),
      Number(productsGrowthRows[0]?.lastMonthCount ?? 0),
    ),
    totalSold: Number(totalSoldRows[0]?.totalSold ?? 0),
    totalSales: Number(totalSoldRows[0]?.totalSales ?? 0),
    soldTrend: buildDailyTrend(
      (soldTrendRows as any[]).map((r) => ({
        period: r.period,
        value: r.soldValue,
      })),
      14,
    ),
    salesTrend: buildDailyTrend(
      (soldTrendRows as any[]).map((r) => ({
        period: r.period,
        value: r.salesValue,
      })),
      14,
    ),
    soldGrowthPct: growthPct(
      Number(soldGrowthRows[0]?.thisMonthSold ?? 0),
      Number(soldGrowthRows[0]?.lastMonthSold ?? 0),
    ),
    salesGrowthPct: growthPct(
      Number(soldGrowthRows[0]?.thisMonthSales ?? 0),
      Number(soldGrowthRows[0]?.lastMonthSales ?? 0),
    ),
    bestSeller: bestSeller
      ? {
          prodId: bestSeller.prodId,
          prodName: bestSeller.prodName,
          totalSold: Number(bestSeller.totalSold),
        }
      : null,
    bestSellerTrend,
  };
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
    (
      SELECT b.barcodeId FROM Barcodes b
      WHERE b.prodVarId = pv.prodVarId
      ORDER BY b.barcodeId ASC LIMIT 1
    ) AS barcodeId,
    (
      SELECT b.barcode FROM Barcodes b
      WHERE b.prodVarId = pv.prodVarId
      ORDER BY b.barcodeId ASC LIMIT 1
    ) AS barcode,
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
      OR EXISTS (
        SELECT 1 FROM Barcodes bs
        WHERE bs.prodVarId = pv.prodVarId AND bs.barcode LIKE ?
      )
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
  category,
  unit,
  sortBy,
  order,
  limit,
  offset,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  category?: string;
  unit?: string;
  sortBy?: string;
  order?: string;
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
pv.prodVarPriceOnline,
pv.prodVarImage,
pv.prodVarId,
    p.prodName,
    iis.inventoryItemQuantity
FROM ProductVariants pv
LEFT JOIN Products p ON p.prodId = pv.prodId
LEFT JOIN InventoryItems iis ON iis.inventoryItemId = pv.inventoryItemId
LEFT JOIN ProductCategories pc ON pc.prodCatId = p.prodCatId
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
    )
  `;

    params.push(keyword, keyword);
  }
  if (category?.trim() && category !== "all") {
    if (category === "null") {
      sql += ` AND pc.prodCatName IS NULL`;
    } else {
      sql += ` AND TRIM(pc.prodCatName) = TRIM(?)`;
      params.push(category.trim());
    }
  }
  if (unit?.trim()) {
    sql += ` AND pv.prodVarUnit = ?`;
    params.push(unit.trim());
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  // Whitelisted to prevent SQL injection since sortBy/order come from query params.
  const sortColumns: Record<string, string> = {
    price: "pv.prodVarPriceOnline",
  };
  const sortColumn = sortColumns[sortBy?.trim().toLowerCase() ?? ""];
  const sortOrder = order?.trim().toLowerCase() === "desc" ? "DESC" : "ASC";
  // In-stock items always come first, regardless of the requested sort.
  sql += ` ORDER BY (COALESCE(iis.inventoryItemQuantity, 0) > 0) DESC`;
  if (sortColumn) {
    sql += `, ${sortColumn} ${sortOrder}`;
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
  category,
  unit,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<ProductVariants>;
  search?: string;
  category?: string;
  unit?: string;
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
LEFT JOIN ProductCategories pc ON pc.prodCatId = p.prodCatId
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
    )
  `;

    params.push(keyword, keyword);
  }
  if (category?.trim() && category !== "all") {
    if (category === "null") {
      sql += ` AND pc.prodCatName IS NULL`;
    } else {
      sql += ` AND TRIM(pc.prodCatName) = TRIM(?)`;
      params.push(category.trim());
    }
  }
  if (unit?.trim()) {
    sql += ` AND pv.prodVarUnit = ?`;
    params.push(unit.trim());
  }
  if (statusSold) {
  }
  if (from && to) {
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0].totalItems;
};

export const selectKioskProductVariants = async ({
  connection,
  storeId,
}: {
  connection?: PoolConnection;
  storeId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `
    SELECT
      pv.prodVarId,
      pv.prodVarName,
      pv.prodVarPrice,
      pv.prodVarUnit,
      pv.prodVarImage,
      pv.kioskOrder,
      p.prodId,
      p.prodName,
      pc.prodCatId,
      pc.prodCatName
    FROM ProductVariants pv
    LEFT JOIN Products p ON p.prodId = pv.prodId
    LEFT JOIN ProductCategories pc ON pc.prodCatId = p.prodCatId
    WHERE pv.prodVarDeletedAt IS NULL
      AND pv.isAvailableKiosk = 1
      AND p.storeId = ?
      AND p.prodDeletedAt IS NULL
    ORDER BY (pv.kioskOrder = 0), pv.kioskOrder ASC, pv.prodVarName ASC
  `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, [storeId]);
  return rows;
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
      OR EXISTS (
        SELECT 1 FROM Barcodes bs
        WHERE bs.prodVarId = pv.prodVarId AND bs.barcode LIKE ?
      )
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

  assertKnownColumns(keyFields, PRODUCT_VARIANT_COLUMNS, "ProductVariants");
  assertKnownColumns(
    Object.keys(updates[0]),
    PRODUCT_VARIANT_COLUMNS,
    "ProductVariants",
  );

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

  assertKnownColumns(keyFields, PRODUCT_CATEGORY_COLUMNS, "ProductCategories");
  assertKnownColumns(
    Object.keys(updates[0]),
    PRODUCT_CATEGORY_COLUMNS,
    "ProductCategories",
  );

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

  assertKnownColumns(
    keyFields,
    VARIANT_COMPONENT_COLUMNS,
    "VariantComponents",
  );
  assertKnownColumns(
    Object.keys(updates[0]),
    VARIANT_COMPONENT_COLUMNS,
    "VariantComponents",
  );

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
