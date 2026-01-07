import { CreateCustomerDto } from "@/dtos/customer.dto";
import { getDBConnection } from "@/lib/db";
import { Customer } from "@/types/customer";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCustomer = async ({
  data,
  connection,
}: {
  data: CreateCustomerDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Customers(customerName,customerEmail,customerPhone,customerType,customerCreatedBy,storeId) VALUES(?,?,?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.customerName,
    data.customerEmail,
    data.customerPhone,
    data.customerType,
    data.customerCreatedBy,
    data.storeId,
  ]);
  return result.insertId;
};

export const selectCustomers = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<Customer>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const params: any[] = [];
  let sql = ` SELECT 
    c.*,
    s.storeName,
    s.storeId,
    -- total spent per customer
    (SELECT SUM(s.salesTotalAmount) 
     FROM Sales s 
     WHERE s.customerId = c.customerId) AS totalSpent,
     
    -- last visit
    (SELECT s.salesCreatedAt 
     FROM Sales s 
     WHERE s.customerId = c.customerId 
     ORDER BY s.salesCreatedAt DESC 
     LIMIT 1) AS lastVisit,
     
    -- first visit
    (SELECT s.salesCreatedAt 
     FROM Sales s 
     WHERE s.customerId = c.customerId 
     ORDER BY s.salesCreatedAt ASC 
     LIMIT 1) AS firstVisit
FROM Customers c
LEFT JOIN Stores s ON s.storeId = c.storeId 
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
  return rows as Customer[];
};
