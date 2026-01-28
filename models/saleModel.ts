import {
  CreateSalePaymentDto,
  CreateSaleDto,
  CreateSaleItemDto,
  DisplaySalesItems,
  CreateSalesDiscount,
} from "@/dtos/sales.dto";
import { getDBConnection } from "@/lib/db";
import { Sales } from "@/types/sales";
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
}: {
  keyFields: Partial<Sales>;
  connection?: PoolConnection;
  search?: string;
  storeName?: string;
  from?: string;
  to?: string;
  includeSaleItems?: boolean;
  customer?: boolean;
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
    'prodVarName', pv.prodVarName,
    'saleItemName',
      CASE
        WHEN pv.prodVarName IS NULL THEN p.prodName
        WHEN pv.prodVarName LIKE CONCAT('%', p.prodName, '%')
          THEN pv.prodVarName
        ELSE CONCAT(p.prodName, ' ', pv.prodVarName)
      END
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
	 ) AS salesDiscounts
FROM Sales s
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
  sql += ` ORDER BY s.salesCreatedAt DESC `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Sales[];
};

export const insertSales = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Sales(salesNo,salesInvoice,salesTotalAmount,salesSubTotal,salesTotalPaid,salesCreatedBy,storeId,customerId,salesStatus) VALUES(?,?,?,?,?,?,?,?,?)`;
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
  const sql = `INSERT INTO SalesItems(salesItemQuantity,salesItemPrice,salesItemSubtotal,salesId,inventoryItemId,prodVarId) 
            VALUES ${data.map(() => "(?, ?, ?,?,?,?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.salesItemQuantity,
    item.salesItemPrice,
    item.salesItemSubtotal,
    item.salesId,
    item.inventoryItemId,
    item.prodVarId,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
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
  let sql = `SELECT * FROM SalesItems si
  LEFT JOIN ProductVariants pv ON pv.prodVarId = si.prodVarId
  LEFT JOIN Products p ON p.prodId = pv.prodId
  WHERE 1=1`;
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

export const selectSalesTotalDetails = async (storeId?: number) => {
  const pool = await getDBConnection();
  let sql;

  if (storeId) {
    sql = `SELECT 
(SELECT SUM(s.salesTotalAmount) FROM Sales s WHERE s.storeId = ?) AS totalSales,
(SELECT COUNT(DISTINCT(c.customerId)) FROM Customers c LEFT JOIN Sales s ON s.customerId = c.customerId AND s.storeId = ?) AS totalCustomer, 
  (SELECT SUM(s.salesTotalAmount)
   FROM Sales s
   WHERE s.storeId = ?
     AND s.salesCreatedAt >= CURDATE()
     AND s.salesCreatedAt < CURDATE() + INTERVAL 1 DAY
  ) AS todaySales,
    (SELECT COUNT(*)
   FROM Sales s
   WHERE s.storeId = ?
  ) AS totalCountSales;`;
  } else {
    sql = `SELECT 
  (SELECT SUM(s.salesTotalAmount)
   FROM Sales s
  ) AS totalSales,

  (SELECT COUNT(DISTINCT c.customerId)
   FROM Customers c
   LEFT JOIN Sales s 
     ON s.customerId = c.customerId
  ) AS totalCustomer,

  (SELECT SUM(s.salesTotalAmount)
   FROM Sales s
   WHERE s.salesCreatedAt >= CURDATE()
     AND s.salesCreatedAt < CURDATE() + INTERVAL 1 DAY
  ) AS todaySales,

  (SELECT COUNT(*)
   FROM Sales s
  ) AS totalCountSales;
`;
  }

  const [rows] = await pool.execute(
    sql,
    storeId ? [storeId, storeId, storeId, storeId] : [],
  );
  return rows;
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
