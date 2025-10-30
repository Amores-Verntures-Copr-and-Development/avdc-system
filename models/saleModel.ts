import {
  CreateSalePaymentDto,
  CreateSaleDto,
  CreateSaleItemDto,
} from "@/dtos/sales.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertSales = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Sales(customerId,receiptNo,salesCreatedBy,salesTotalAmount,storeId) VALUES(?,?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.customerId ?? null,
    data.receiptNo,
    data.salesCreatedBy,
    data.salesTotalAmount,
    data.storeId,
  ]);
  return results.insertId;
};

export const selectCountSales = async ({
  connection,
  storeId,
}: {
  connection?: PoolConnection;
  storeId: number;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT COUNT(*) as total FROM Sales WHERE storeId = ?`;
  console.log("SQL: ", sql);
  console.log("storeId: ", storeId);
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [storeId]);
  return rows[0];
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
  const sql = `INSERT INTO SaleItems(salesId,inventoryItemId,saleItemQuantity,saleItemPrice,saleItemSubtotal) 
            VALUES ${data.map(() => "(?, ?, ?,?,?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.salesId,
    item.inventoryItemId,
    item.saleItemQuantity,
    item.saleItemPrice,
    item.saleItemQuantity * item.saleItemPrice,
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
  const sql = `INSERT INTO SalePayments(salesPaymentMethod,salesPaymentAmount,paymentReference,salesId) 
            VALUES ${data.map(() => "(?, ?, ?,?)").join(", ")}`;
  const values = data.flatMap((item) => [
    item.salesPaymentMethod,
    item.salesPaymentAmount,
    item.paymentReference,
    item.salesId,
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
