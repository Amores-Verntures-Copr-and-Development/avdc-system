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
  const sql = `INSERT INTO Customers(customerName,customerEmail,customerPhone,customerType,customerCreatedBy,storeId) VALUES ${data.map(() => "(?,?,?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.customerName ?? "",
    item.customerEmail ?? "",
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
