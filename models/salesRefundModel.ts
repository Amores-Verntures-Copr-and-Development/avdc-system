import {
  CreateSaleItemRefundDto,
  CreateSalePaymentRefundDto,
  CreateSalesRefundDto,
} from "@/dtos/sales-refund.dto";
import { getDBConnection } from "@/lib/db";
import { SalesItemRefund, SalesRefund } from "@/types/sales-refund";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

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
  const sql = `INSERT INTO SalesItemRefunds(salesRefId,salesItemId,salesRefItemQty,salesRefItemPrice,restockQty)
               VALUES ${data.map(() => "(?,?,?,?,?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.salesRefId,
    item.salesItemId,
    item.salesRefItemQty,
    item.salesRefItemPrice,
    item.restockQty ?? 0,
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

export const selectSalesRefunds = async ({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SalesRefund>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `
SELECT * FROM SalesRefunds sr WHERE 1=1
`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sr.${key} IS NULL`;
    } else {
      sql += ` AND sr.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as SalesRefund[];
};

export const selectSalesItemRefunds = async ({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SalesItemRefund>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `
SELECT * FROM SalesItemRefunds sif WHERE 1=1
`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sif.${key} IS NULL`;
    } else {
      sql += ` AND sif.${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as SalesItemRefund[];
};

export const selectSalesItemWithTotalRefunds = async ({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<SalesItemRefund>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `
SELECT si.*,SUM(sir.salesRefItemQty) AS totalItemRefunds FROM SalesItems si
LEFT JOIN SalesItemRefunds sir ON sir.salesItemId = si.salesItemId
WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND si.${key} IS NULL`;
    } else {
      sql += ` AND si.${key} = ?`;
      params.push(value);
    }
  }

  sql += ` GROUP BY si.salesItemId`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};
