import {
  CreateSalePaymentDto,
  CreateSaleDto,
  CreateSaleItemDto,
  DisplaySalesItems,
  CreateSalesDiscount,
  CreateSaleItemDisc,
} from "@/dtos/sales.dto";
import { getDBConnection } from "@/lib/db";
import { SaleItems, SalePayments, Sales } from "@/types/sales";
import {
  Connection,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

export const selectSales = async ({
  keyFields = {},
  connection,
  search,
  storeName,
  from,
  to,
  includeSaleItems,
  customer,
  limit,
  offset,
  customerId,
  storeId,
  method,
}: {
  keyFields: Partial<Sales>;
  connection?: PoolConnection;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
  limit?: number;
  offset?: number;
  customerId?: number;
  storeId?: number;
  method?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT 
  s.*,
  st.storeName,
  CONCAT_WS(' ', u.userName, u.userLname) AS salesCreatedByName,
  c.customerName,
  (
    SELECT COUNT(*)
    FROM SalesItems si
    WHERE si.salesId = s.salesId
  ) AS totalItem,
${
  includeSaleItems
    ? `  (SELECT JSON_ARRAYAGG(
  JSON_OBJECT(
    'salesItemId', si.salesItemId,
    'salesItemQuantity', si.salesItemQuantity,
    'salesItemPrice', si.salesItemPrice,
    'salesItemSubtotal', si.salesItemSubtotal,
    'salesItemTotal', si.salesItemTotal,
    'prodVarName', pv.prodVarName,
    'saleItemName',
      CASE
        WHEN pv.prodVarName IS NULL THEN p.prodName
        WHEN pv.prodVarName LIKE CONCAT('%', p.prodName, '%')
          THEN pv.prodVarName
        ELSE CONCAT(p.prodName, ' ', pv.prodVarName)
      END,
      'salesItemDiscounts',
              (
              SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                  'salesItemDiscId', sid.salesItemDiscId,
                  'discountId', d.discountId,
                  'discountAmount', sid.discountAmount,
                  'discountName', d.discountName,
                  'discountValue', d.discountValue,
                  'discountType',d.discountType
                  
                )
              )
              FROM SalesItemsDiscount sid
					    LEFT JOIN Discounts d ON d.discountId = sid.discountId
              WHERE sid.salesItemId = si.salesItemId
            )
  )
)
FROM SalesItems si
LEFT JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
LEFT JOIN Products p ON p.prodId = pv.prodId
WHERE si.salesId = s.salesId
) AS saleItems,`
    : ``
}
  (
  SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'salesPaymentId',sp.salesPaymentId,
        'salesPaymentAmount',sp.salesPaymentAmount,
        'paymentReference',sp.paymentReference,
        'payMetName', pm.payMetName,
        'payMetId',pm.payMetId
      )
    )
    FROM SalesPayments sp
    LEFT JOIN PaymentMethods pm ON pm.payMetId = sp.payMetId
	 WHERE sp.salesId = s.salesId
	 ) AS paymentMethods,
	  (SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'salesDiscountId',sd.salesDiscountId,
        'saleId',sd.saleId,
        'discountId',sd.discountId,
        'discountAmount', sd.discountAmount,
        'discountName',d.discountName,
        'discountType',d.discountType,
        'discountValue',d.discountValue
      )
    )
    FROM SalesDiscounts sd
    LEFT JOIN Discounts d ON d.discountId = sd.discountId
	 WHERE sd.saleId = s.salesId
	 ) AS salesDiscounts,
    	     (
  SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'salesRefId',sr.salesRefId,
        'salesId',sr.salesId,
        'storeId',sr.storeId,
        'salesRefAmount', sr.salesRefAmount
      )
    )
    FROM SalesRefunds sr
	 WHERE sr.salesId = s.salesId
	 ) AS salesRefunds,
	  (
  SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'salesPayRefId',spr.salesPayRefId,
        'salesRefId',spr.salesRefId,
        'paymetId',spr.paymetId,
        'salesPayRefAmount', spr.salesPayRefAmount,
        'salesPayRefReference', spr.salesPayRefReference
      )
    )
    FROM SalesPaymentRefunds spr
    LEFT JOIN SalesRefunds srs ON srs.salesRefId = spr.salesRefId
	 WHERE srs.salesId = s.salesId
	 ) AS salesPaymentRefunds
FROM Sales s
LEFT JOIN SalesRefunds sr ON sr.salesId = s.salesId
LEFT JOIN Customers c ON c.customerId = s.customerId
LEFT JOIN Users u ON u.userId = s.salesCreatedBy
LEFT JOIN Stores st ON st.storeId = s.storeId
WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND s.${key} IS NULL`;
    } else {
      sql += ` AND s.${key} = ?`;
      params.push(value);
    }
  }
  if (storeName) {
    sql += ` AND st.storeName LIKE ?`;
    params.push(`%${storeName}%`);
  }

  if (customerId) {
    sql += ` AND s.customerId = ? `;
    params.push(customerId);
  }
  if (storeId) {
    sql += ` AND s.storeId = ? `;
    params.push(customerId);
  }
  if (from && to) {
    sql += ` AND DATE(s.salesCreatedAt) BETWEEN ? AND ?`;
    params.push(from);
    params.push(to);
  }
  if (search) {
    const wildcard = `%${search}%`;
    sql += ` AND s.salesNo LIKE ? OR c.customerName LIKE ? `;
    params.push(wildcard);
    params.push(wildcard);
  }
  if (customer) {
    sql += ` AND s.customerId IS NOT NULL`;
  }
  if (method) {
    sql += `
    AND EXISTS (
      SELECT 1
      FROM SalesPayments sp
      INNER JOIN PaymentMethods pm
        ON pm.payMetId = sp.payMetId
      WHERE sp.salesId = s.salesId
        AND pm.payMetName = ?
    )
  `;
    params.push(method);
  }

  sql += ` ORDER BY s.salesCreatedAt DESC `;

  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const countSales = async ({
  keyFields = {},
  connection,
  search,
  storeName,
  from,
  to,
  customerId,
  customer,
  storeId,
  method,
}: {
  keyFields: Partial<Sales>;
  connection?: PoolConnection;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  customer?: boolean;
  customerId?: number;
  storeId?: number;
  method?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT COUNT(*) as count FROM Sales s
LEFT JOIN SalesRefunds sr ON sr.salesId = s.salesId
LEFT JOIN Customers c ON c.customerId = s.customerId
LEFT JOIN Users u ON u.userId = s.salesCreatedBy
LEFT JOIN Stores st ON st.storeId = s.storeId WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND s.${key} IS NULL`;
    } else {
      sql += ` AND s.${key} = ?`;
      params.push(value);
    }
  }
  if (storeName) {
    sql += ` AND st.storeName LIKE ?`;
    params.push(`%${storeName}%`);
  }

  if (from && to) {
    sql += ` AND DATE(s.salesCreatedAt) BETWEEN ? AND ?`;
    params.push(from);
    params.push(to);
  }
  if (search) {
    const wildcard = `%${search}%`;
    sql += ` AND s.salesNo LIKE ? OR c.customerName LIKE ? `;
    params.push(wildcard);
    params.push(wildcard);
  }
  if (customer) {
    sql += ` AND s.customerId IS NOT NULL`;
  }
  if (customerId) {
    sql += ` AND s.customerId = ? `;
    params.push(customerId);
  }
  if (storeId) {
    sql += ` AND s.storeId = ? `;
    params.push(storeId);
  }
  if (method) {
    sql += `
    AND EXISTS (
      SELECT 1
      FROM SalesPayments sp
      INNER JOIN PaymentMethods pm
        ON pm.payMetId = sp.payMetId
      WHERE sp.salesId = s.salesId
        AND pm.payMetName = ?
    )
  `;
    params.push(method);
  }
  sql += ` ORDER BY s.salesCreatedAt DESC `;

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const insertSales = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Sales(salesNo,salesInvoice,salesTotalAmount,salesSubTotal,salesTotalPaid,salesCreatedBy,storeId,customerId,salesStatus,salesRemarks) VALUES(?,?,?,?,?,?,?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.salesNo,
    data.salesInvoice,
    data.salesTotalAmount,
    data.salesSubTotal,
    data.salesTotalPaid,
    data.salesCreatedBy,
    data.storeId,
    data.customerId || null,
    data.salesStatus,
    data.salesRemarks || "",
  ]);
  return results.insertId;
};

export const updateSales = async ({
  connection,
  updates,
  keyFields = ["salesId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<Sales>[];
  keyFields?: (keyof Sales)[]; // which fields define the WHERE condition
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Sales),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN for each update field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      // Build WHERE condition for each key (e.g., poItemId, itemId)
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add all key values + field value to params
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    setClauses.push(`${field} = CASE ${caseParts.join(" ")} END`);
  }

  // ✅ WHERE clause (unique combination of all key values)
  const whereConditions: string[] = [];
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  // Create `WHERE (key1, key2) IN ((?, ?), (?, ?))` if multiple keys
  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Push all key values again for WHERE condition
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE Sales
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const updateSalePayments = async ({
  connection,
  updates,
  keyFields = ["salesPaymentId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<SalePayments>[];
  keyFields?: (keyof SalePayments)[]; // which fields define the WHERE condition
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof SalePayments),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN for each update field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      // Build WHERE condition for each key (e.g., poItemId, itemId)
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add all key values + field value to params
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    setClauses.push(`${field} = CASE ${caseParts.join(" ")} END`);
  }

  // ✅ WHERE clause (unique combination of all key values)
  const whereConditions: string[] = [];
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  // Create `WHERE (key1, key2) IN ((?, ?), (?, ?))` if multiple keys
  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Push all key values again for WHERE condition
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE SalesPayments
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const updateSaleItems = async ({
  connection,
  updates,
  keyFields = ["salesItemId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<SaleItems>[];
  keyFields?: (keyof SaleItems)[]; // which fields define the WHERE condition
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  // ✅ Determine all updatable fields (exclude keys)
  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof SaleItems),
  );

  if (updateFields.length === 0)
    throw new Error("No fields to update (all are key fields).");

  const setClauses: string[] = [];
  const params: any[] = [];

  // ✅ Build CASE WHEN for each update field
  for (const field of updateFields) {
    const caseParts: string[] = [];

    for (const row of updates) {
      // Build WHERE condition for each key (e.g., poItemId, itemId)
      const whenClause = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenClause} THEN ?`);

      // Add all key values + field value to params
      keyFields.forEach((k) => params.push((row as any)[k]));
      params.push((row as any)[field]);
    }

    setClauses.push(`${field} = CASE ${caseParts.join(" ")} END`);
  }

  // ✅ WHERE clause (unique combination of all key values)
  const whereConditions: string[] = [];
  const uniqueKeyCombinations = updates.map((row) =>
    keyFields.map((k) => (row as any)[k]),
  );

  // Create `WHERE (key1, key2) IN ((?, ?), (?, ?))` if multiple keys
  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map((row) => `(${row.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Push all key values again for WHERE condition
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  const sql = `
    UPDATE SalesItems
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};
export const selectCountSales = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Sales>;
  connection?: Connection;
}): Promise<number> => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT COUNT(*) as total FROM Sales s WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND s.${key} IS NULL`;
    } else {
      sql += ` AND s.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute(sql, params);

  const total = (rows as any)[0]?.total ?? 0;

  return Number(total);
};

export const insertSaleItems = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSaleItemDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }

  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO SalesItems(salesItemQuantity, salesItemPrice, salesItemSubtotal, salesItemTotal,  salesId, prodVarId) 
               VALUES ${data.map(() => "(?, ?, ?, ?, ?,?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.salesItemQuantity,
    item.salesItemPrice,
    item.salesItemSubtotal,
    item.salesItemTotal,
    item.salesId,
    item.prodVarId,
  ]);

  const [result] = await pool.execute<ResultSetHeader>(sql, values);

  const insertId = result.insertId; // first inserted ID
  const affectedRows = result.affectedRows; // number of inserted rows

  // return all IDs
  const insertedIds = Array.from(
    { length: affectedRows },
    (_, i) => insertId + i,
  );

  return insertedIds;
};

export const insertSalePayments = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSalePaymentDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SalesPayments(salesPaymentAmount,salesPaymentStatus,salesId,payMetId,paymentReference)
            VALUES ${data.map(() => "(?, ?,?, ?,?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.salesPaymentAmount,
    item.salesPaymentStatus,
    item.salesId,
    item.payMetId,
    item.paymentReference ?? "",
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectDailyStoreSales = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT 
  st.storeId,
  st.storeName,
  SUM(CASE WHEN DATE(ss.salesCreatedAt) = CURDATE() THEN ss.salesTotalAmount ELSE 0 END) AS todaySales,
  SUM(CASE WHEN DATE(ss.salesCreatedAt) = DATE_SUB(CURDATE(), INTERVAL 1 DAY) THEN ss.salesTotalAmount ELSE 0 END) AS yesterdaySales
FROM Stores st
LEFT JOIN Sales ss 
  ON ss.storeId = st.storeId
GROUP BY st.storeId, st.storeName;`;
  const [rows] = await pool.execute(sql);
  return rows;
};

export const selectSalesItems = async ({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<Sales>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `
SELECT *, (
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'salesItemDiscId', sid.salesItemDiscId,
      'discountId', sid.discountId,
      'discountAmount', sid.discountAmount,
      'discountName', d.discountName,
      'discountValue', d.discountValue,
      'discountType', d.discountType
    )
  )
  FROM SalesItemsDiscount sid
  LEFT JOIN Discounts d ON d.discountId = sid.discountId
  WHERE sid.salesItemId = si.salesItemId
) AS salesItemDiscounts, (
  SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
      'salesItemRefId', sr.salesItemRefId,
      'salesRefId', sr.salesRefId,
      'salesItemId', sr.salesItemId,
      'salesRefItemQty', sr.salesRefItemQty,
      'salesRefItemPrice', sr.salesRefItemPrice
    )
  )
  FROM SalesItemRefunds sr
  WHERE sr.salesItemId = si.salesItemId
) AS salesItemsRefunds
FROM SalesItems si
LEFT JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
LEFT JOIN Products p ON p.prodId = pv.prodId
WHERE 1=1
`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND si.${key} IS NULL`;
    } else {
      sql += ` AND si.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as DisplaySalesItems[];
};

export const selectSalesTotalDetails = async ({
  storeId,
  store,
  from,
  to,
}: {
  storeId?: number;
  store?: string;
  from?: string;
  to?: string;
}) => {
  const pool = await getDBConnection();

  let totalSaleConditions: string[] = [];
  let totalSalesparams: any[] = [];

  let totalSalePaymentMethodConditions: string[] = [];
  let totalSalePaymentMethodparams: any[] = [];

  let todaySalePaymentMethodConditions: string[] = [];
  let todaySalePaymentMethodparams: any[] = [];

  let totalCountSalesconditions: string[] = [];
  let totalCountSalesparams: any[] = [];

  let todaySalesConditions: string[] = [];
  let todaySalesparams: any[] = [];

  let totalCustomerConditions: string[] = [];
  let totalCustomeparams: any[] = [];

  if (storeId) {
    totalSaleConditions.push("s.storeId = ?");
    totalSalesparams.push(storeId);

    totalSalePaymentMethodConditions.push("s.storeId = ?");
    totalSalePaymentMethodparams.push(storeId);

    todaySalePaymentMethodConditions.push("s.storeId = ?");
    todaySalePaymentMethodparams.push(storeId);

    totalCountSalesconditions.push("s.storeId = ?");
    totalCountSalesparams.push(storeId);

    todaySalesConditions.push("s.storeId = ?");
    todaySalesparams.push(storeId);

    totalCustomerConditions.push("s.storeId = ?");
    totalCustomeparams.push(storeId);
  }

  if (store) {
    totalSaleConditions.push("st.storeName LIKE ?");
    totalSalesparams.push(`%${store}%`);

    totalSalePaymentMethodConditions.push("st.storeName LIKE ?");
    totalSalePaymentMethodparams.push(`%${store}%`);

    todaySalePaymentMethodConditions.push("st.storeName LIKE ?");
    todaySalePaymentMethodparams.push(`%${store}%`);

    totalCountSalesconditions.push("st.storeName LIKE ?");
    totalCountSalesparams.push(`%${store}%`);

    todaySalesConditions.push("st.storeName LIKE ?");
    todaySalesparams.push(`%${store}%`);

    totalCustomerConditions.push("st.storeName LIKE ?");
    totalCustomeparams.push(`%${store}%`);
  }

  if (from && to) {
    totalSaleConditions.push("DATE(s.salesCreatedAt) BETWEEN ? AND ?");
    totalSalesparams.push(from, to);

    totalSalePaymentMethodConditions.push(
      "DATE(s.salesCreatedAt) BETWEEN ? AND ?",
    );
    totalSalePaymentMethodparams.push(from, to);

    totalCountSalesconditions.push("DATE(s.salesCreatedAt) BETWEEN ? AND ?");
    totalCountSalesparams.push(from, to);

    totalCustomerConditions.push("DATE(s.salesCreatedAt) BETWEEN ? AND ?");
    totalCustomeparams.push(from, to);
  }

  const totalSalesWhereClause =
    totalSaleConditions.length > 0
      ? `WHERE ${totalSaleConditions.join(" AND ")}`
      : "";

  const totalSalesPaymentMethodsClause =
    totalSalePaymentMethodConditions.length > 0
      ? ` WHERE ${totalSalePaymentMethodConditions.join(" AND ")}`
      : "";
  todaySalePaymentMethodConditions.push(`s.salesCreatedAt >= CURDATE()`);
  const todaysSalesPaymentMethodsClause =
    todaySalePaymentMethodConditions.length > 0
      ? ` WHERE ${todaySalePaymentMethodConditions.join(" AND ")}`
      : "";

  const totalCountSaleWhereClause =
    totalCountSalesconditions.length > 0
      ? `WHERE ${totalCountSalesconditions.join(" AND ")}`
      : "";
  const todaySalesWhereClause =
    todaySalesConditions.length > 0
      ? `WHERE ${todaySalesConditions.join(" AND ")}`
      : "";
  const totalCustomerWhereClause =
    totalCustomerConditions.length > 0
      ? `WHERE ${totalCustomerConditions.join(" AND ")}`
      : "";

  // 1️⃣ Total Sales
  const totalSalesSql = `
  SELECT 
    COALESCE(SUM(s.salesTotalAmount) - COALESCE(SUM(sr.totalRefunds),0), 0) AS totalSales
  FROM Sales s
  LEFT JOIN Stores st ON s.storeId = st.storeId
  LEFT JOIN (
    SELECT salesId, SUM(salesRefAmount) AS totalRefunds
    FROM SalesRefunds
    GROUP BY salesId
  ) sr ON sr.salesId = s.salesId
  ${totalSalesWhereClause};
`;

  const totalSalesPaymentMethodsSql = `
  SELECT
    COALESCE(SUM(sp.salesPaymentAmount), 0)
    - COALESCE(SUM(spr.salesPayRefAmount), 0) AS salesPayAmount,
    pm.payMetName
  FROM Sales s
  LEFT JOIN SalesPayments sp 
    ON sp.salesId = s.salesId
  LEFT JOIN Stores st 
    ON s.storeId = st.storeId
  LEFT JOIN PaymentMethods pm 
    ON pm.payMetId = sp.payMetId
  LEFT JOIN SalesRefunds sr 
    ON sr.salesId = s.salesId
  LEFT JOIN SalesPaymentRefunds spr 
    ON spr.salesRefId = sr.salesRefId
  ${totalSalesPaymentMethodsClause}
  GROUP BY pm.payMetName
`;

  // 2️⃣ Total Count of Sales
  const totalCountSalesSql = `
    SELECT COUNT(*) AS totalCountSales
    FROM Sales s
    LEFT JOIN Stores st ON s.storeId = st.storeId
    ${totalCountSaleWhereClause};
  `;

  const todaysSalesPaymentMethodsSql = `
  SELECT
    COALESCE(SUM(sp.salesPaymentAmount), 0)
    - COALESCE(SUM(spr.salesPayRefAmount), 0) AS salesPayAmount,
    pm.payMetName
  FROM Sales s
  LEFT JOIN SalesPayments sp 
    ON sp.salesId = s.salesId
  LEFT JOIN Stores st 
    ON s.storeId = st.storeId
  LEFT JOIN PaymentMethods pm 
    ON pm.payMetId = sp.payMetId
  LEFT JOIN SalesRefunds sr 
    ON sr.salesId = s.salesId
  LEFT JOIN SalesPaymentRefunds spr 
    ON spr.salesRefId = sr.salesRefId
  ${todaysSalesPaymentMethodsClause}
  GROUP BY pm.payMetName
`;

  // 3️⃣ Today Sales (CURDATE)
  const todaySalesSql = `
  SELECT 
  COALESCE(
    SUM(
      CASE 
        WHEN DATE(s.salesCreatedAt) = CURDATE() 
        THEN s.salesTotalAmount 
        ELSE 0 
      END
    ) 
    -
    COALESCE(
      SUM(
        CASE 
          WHEN DATE(s.salesCreatedAt) = CURDATE() 
          THEN sr.totalRefunds 
          ELSE 0 
        END
      ), 
    0),
  0) AS todaySales
FROM Sales s
LEFT JOIN Stores st ON s.storeId = st.storeId
LEFT JOIN (
  SELECT 
    salesId, 
    SUM(salesRefAmount) AS totalRefunds
  FROM SalesRefunds
  GROUP BY salesId
) sr ON sr.salesId = s.salesId
  ${todaySalesWhereClause};
`;

  // 4️⃣ Total Customers
  const totalCustomerSql = `
    SELECT COUNT(DISTINCT s.customerId) AS totalCustomer
    FROM Sales s
    LEFT JOIN Stores st ON s.storeId = st.storeId
    ${totalCustomerWhereClause};
  `;

  // Execute all queries
  const [totalSalesRows]: any = await pool.query(
    totalSalesSql,
    totalSalesparams,
  );
  const [totalSalesPaymentMethodRows]: any = await pool.execute(
    totalSalesPaymentMethodsSql,
    totalSalePaymentMethodparams,
  );
  const [todaysSalesPaymentMethodRows]: any = await pool.execute(
    todaysSalesPaymentMethodsSql,
    todaySalePaymentMethodparams,
  );
  const [totalCountRows]: any = await pool.query(
    totalCountSalesSql,
    totalCountSalesparams,
  );
  const [todaySalesRows]: any = await pool.query(
    todaySalesSql,
    todaySalesparams,
  );
  const [totalCustomerRows]: any = await pool.query(
    totalCustomerSql,
    totalCustomeparams,
  );

  return [
    {
      totalSales: totalSalesRows[0].totalSales,
      totalSalesPaymentMethods: totalSalesPaymentMethodRows,
      totalCountSales: totalCountRows[0].totalCountSales,
      todaySales: todaySalesRows[0].todaySales,
      totalCustomer: totalCustomerRows[0].totalCustomer,
      todaysSalesPaymentMethods: todaysSalesPaymentMethodRows,
    },
  ];
};
export const insertSaleDiscounts = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSalesDiscount[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SalesDiscounts(saleId,discountId,discountAmount) 
            VALUES ${data.map(() => "(?, ?, ?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.saleId,
    item.discountId,
    item.discountAmount,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const insertSaleItemDiscounts = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSaleItemDisc[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }

  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO SalesItemsDiscount(salesItemId, discountId, salesItemDiscCreatedBy, discountAmount) 
               VALUES ${data.map(() => "(?, ?, ?, ?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.salesItemId,
    item.discountId,
    item.salesItemDiscCreatedBy,
    item.discountAmount,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result;
};

export const selectSalesByTrend = async ({
  trend,
  from,
  to,
}: {
  trend?: "year" | "month" | "weeks" | "days";
  from?: string;
  to?: string;
}) => {
  const pool = await getDBConnection();

  let periodExpression = "";
  const params: string[] = [];

  switch (trend) {
    case "year":
      periodExpression = "YEAR(s.salesCreatedAt)";
      break;

    case "month":
      periodExpression = "DATE_FORMAT(s.salesCreatedAt, '%Y-%m')";
      break;

    case "weeks":
      periodExpression = "YEARWEEK(s.salesCreatedAt, 1)";
      break;

    case "days":
      periodExpression = "DATE(s.salesCreatedAt)";
      break;

    default:
      periodExpression = "DATE(s.salesCreatedAt)";
  }

  let sql = `
    SELECT
      ${periodExpression} AS period,
      COALESCE(
        SUM(s.salesTotalAmount) - COALESCE(SUM(sr.totalRefunds), 0),
        0
      ) AS totalSales
    FROM Sales s
    LEFT JOIN Stores st
      ON s.storeId = st.storeId
    LEFT JOIN (
      SELECT
        salesId,
        SUM(salesRefAmount) AS totalRefunds
      FROM SalesRefunds
      GROUP BY salesId
    ) sr
      ON sr.salesId = s.salesId
    WHERE 1=1
  `;

  if (from && to) {
    sql += ` AND DATE(s.salesCreatedAt) BETWEEN ? AND ?`;
    params.push(from, to);
  }

  sql += `
    GROUP BY ${periodExpression}
    ORDER BY period ASC
  `;

  const [rows] = await pool.execute(sql, params);

  return rows;
};
