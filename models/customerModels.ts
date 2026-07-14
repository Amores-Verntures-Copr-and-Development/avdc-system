import {
  CreateCustomerAccountDto,
  CreateCustomerDto,
} from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { Barcodes } from "@/types/barcode";
import { Customer, CustomerAccount } from "@/types/customer";
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
  from,
  to,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
  search?: string;
  type?: string;
  limit?: number;
  offset?: number;
  store?: string;
  from?: string;
  to?: string;
}) => {
  const pool = connection ?? (await getDBConnection());
  const safeLimit =
    limit !== undefined ? Math.max(1, Math.floor(Number(limit))) : undefined;

  const safeOffset =
    offset !== undefined ? Math.max(0, Math.floor(Number(offset))) : undefined;
  const params: unknown[] = [];

  let totalSpentExpression = `COALESCE(SUM(sa.salesTotalAmount), 0)`;

  if (from && to) {
    totalSpentExpression = `
      COALESCE(
        SUM(
          CASE
            WHEN sa.salesCreatedAt >= ?
              AND sa.salesCreatedAt <= ?
            THEN sa.salesTotalAmount
            ELSE 0
          END
        ),
        0
      )
    `;

    params.push(from, to);
  }
  let sql = `
    SELECT
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
      ${totalSpentExpression} AS totalSpent,
      MAX(sa.salesCreatedAt) AS lastVisit,
      MIN(sa.salesCreatedAt) AS firstVisit
    FROM Customers c
    LEFT JOIN Stores st
      ON st.storeId = c.storeId
    LEFT JOIN Sales sa
      ON sa.customerId = c.customerId AND sa.storeId = c.storeId
    WHERE 1 = 1
  `;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (search) {
    const searchValue = `%${search}%`;

    sql += `
      AND (
        c.customerName LIKE ?
        OR c.customerEmail LIKE ?
        OR c.customerPhone LIKE ?
      )
    `;

    params.push(searchValue, searchValue, searchValue);
  }

  if (type) {
    sql += ` AND c.customerType = ?`;
    params.push(type);
  }

  if (store) {
    sql += ` AND st.storeName = ?`;
    params.push(store);
  }

  sql += `
    GROUP BY
      c.customerId,
      c.customerName,
      c.customerEmail,
      c.customerPhone,
      c.customerType,
      c.storeId,
      st.storeName,
      c.customerCreatedAt,
      c.customerUpdatedAt,
      c.customerAddress
  `;

  if (safeLimit !== undefined && Number.isFinite(safeLimit)) {
    sql += ` LIMIT ${safeLimit}`;
  }

  if (safeOffset !== undefined && Number.isFinite(safeOffset)) {
    sql += ` OFFSET ${safeOffset}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Customer[];
};

export const selectCountCustomers = async ({
  keyFields = {},
  connection,
  search,
  store,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
  from?: string;
  to?: string;
  search?: string;
  store?: string;
}) => {
  const pool = connection ?? (await getDBConnection());

  const params: unknown[] = [];

  let sql = `
    SELECT COUNT(DISTINCT c.customerId) AS totalCustomer
    FROM Customers c
    LEFT JOIN Stores st ON st.storeId = c.storeId
    LEFT JOIN Sales sa ON sa.customerId = c.customerId
    WHERE 1 = 1
  `;

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === undefined) continue;

    if (value === null) {
      sql += ` AND c.${key} IS NULL`;
    } else {
      sql += ` AND c.${key} = ?`;
      params.push(value);
    }
  }

  if (store) {
    sql += ` AND st.storeName = ?`;
    params.push(store);
  }

  if (search) {
    const searchValue = `%${search}%`;

    sql += `
      AND (
        c.customerName LIKE ?
        OR c.customerEmail LIKE ?
        OR c.customerPhone LIKE ?
      )
    `;

    params.push(searchValue, searchValue, searchValue);
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

export const insertCustomerAccount = async ({
  data,
  connection,
}: {
  data: CreateCustomerAccountDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO CustomerAccounts(firstName,middleName,lastName,company,email,password,customerId) VALUES ${data.map(() => "(?,?,?,?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.firstName,
    item.middleName,
    item.lastName,
    item.company,
    item.email,
    item.password,
    item.customerId,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectCustomerAcconts = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof CustomerAccount, any>>;
}) => {
  const params: any[] = [];
  let sql = `SELECT ca.cusAccId,ca.firstName,ca.middleName,ca.lastName,ca.company,ca.email,ca.password,ca.emailVerified,ca.phoneVerified FROM CustomerAccounts ca WHERE 1 = 1`;
  const pool = connection ? connection : await getDBConnection();
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ca.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ca.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ca.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CustomerAccount[];
};

export const updateCustomerAccounts = async ({
  cusAccId,
  updateData,
  connection,
}: {
  cusAccId: number;
  updateData: Partial<CustomerAccount>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const fields = Object.keys(updateData);
  if (fields.length === 0) return;

  const setClauses = fields.map((field) => `${field} = ?`);
  const params = fields.map((field) => (updateData as any)[field]);
  params.push(cusAccId);

  const sql = `UPDATE CustomerAccounts SET ${setClauses.join(", ")} WHERE cusAccId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, params);
  return result;
};
