import {
  CreateSaleItemRefundDto,
  CreateSalePaymentRefundDto,
  CreateSalesRefundDto,
} from "@/dtos/sales-refund.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

export const insertSalesRefund = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSalesRefundDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SalesRefunds(salesId,storeId,salesRefAmount,salesRefCreatedBy,salesRefReason) VALUES(?,?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.salesId,
    data.storeId,
    data.salesRefAmount,
    data.salesRefCreatedBy,
    data.salesRefReason,
  ]);
  return results.insertId;
};

export const insertSalesItemRefunds = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSaleItemRefundDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }

  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SalesItemRefunds(salesRefId,salesItemId,salesRefItemQty,salesRefItemPrice) 
               VALUES ${data.map(() => "(?,?,?,?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.salesRefId,
    item.salesItemId,
    item.salesRefItemQty,
    item.salesRefItemPrice,
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

export const insertSalesPaymentRefunds = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSalePaymentRefundDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SalesPaymentRefunds(salesRefId,payMetId,salesPayRefAmount,salesPayRefReference) VALUES ${data.map(() => "(?,?,?,?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.salesRefId,
    item.payMetId,
    item.salesPayRefAmount,
    item.salesPayRefReference,
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
