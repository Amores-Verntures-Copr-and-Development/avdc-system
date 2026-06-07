import { CreateCustomerDto } from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { Customer } from "@/types/customer";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCustomer = async ({
  data,
  connection,
}: {
  data: CreateCustomerDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Customers(customerName,customerEmail,customerAddress,customerPhone,customerType,customerCreatedBy,storeId) VALUES ${data.map(() => "(?,?,?,?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.customerName ?? "",
    item.customerEmail ?? "",
    item.customerAddress ?? "",
    item.customerPhone ?? "",
    item.customerType,
    item.customerCreatedBy,
    item.storeId,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCustomers = async ({
  keyFields = {},
  connection,
  limit,
  offset,
  search,
  type,
  store,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
  search?: string;
  type?: string;
  limit?: number;
  offset?: number;
  store?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const params: any[] = [];
  let sql = `SELECT 
  c.customerId,
  c.customerName,
  c.customerEmail,
  c.customerPhone,
  c.customerType,
  c.storeId,
  st.storeName,
  c.customerCreatedAt,
  c.customerUpdatedAt,
  c.customerAddress,
  COALESCE(SUM(sa.salesTotalAmount), 0) AS totalSpent,
  MAX(sa.salesCreatedAt) AS lastVisit,
  MIN(sa.salesCreatedAt) AS firstVisit
  FROM Customers c
  LEFT JOIN Stores st ON st.storeId = c.storeId
  LEFT JOIN Sales sa ON sa.customerId = c.customerId
  WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (search) {
    sql += ` AND (
    c.customerName LIKE ?
    OR c.customerEmail LIKE ?
    OR c.customerPhone LIKE ?
  )`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  if (store) {
    sql += ` AND st.storeName = ?`;
    params.push(store);
  }

  sql += ` GROUP BY c.customerId, c.customerName, c.customerEmail, c.customerPhone, c.customerType, c.storeId, st.storeName`;
  if (limit !== undefined) {
    sql += ` LIMIT ${limit}`;
  }
  if (offset !== undefined) {
    sql += ` OFFSET ${offset}`;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Customer[];
};

export const selectCountCustomers = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const params: any[] = [];
  let sql = `SELECT 
  COUNT(*) as totalCustomer
FROM Customers c
LEFT JOIN Stores st ON st.storeId = c.storeId
LEFT JOIN Sales sa ON sa.customerId = c.customerId
WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows[0];
};

export const updateCustomers = async ({
  connection,
  updates,
  keyFields = ["customerId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Customer>[];
  keyFields?: (keyof Customer)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof Customer),
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
    UPDATE Customers
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;

  const [result] = await pool.execute(sql, params);
  return result;
};
