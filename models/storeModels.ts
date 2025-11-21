import { CreateStoreDto } from "@/dtos/store.dto";
import { getDBConnection } from "../lib/db";
import { skip } from "node:test";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { EmployeeInterface } from "@/types/employees";

export const insertStore = async ({
  data,
  connection,
}: {
  data: CreateStoreDto;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Stores(storeName,storeLocation,storeDescription,storeCreatedBy) VALUES(?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.storeName,
    data.storeLocation,
    data.storeDescription,
    data.storeCreatedBy,
  ]);
  return result.insertId;
};

export const selectStores = async ({
  search,
  limit,
  skip,
}: {
  search?: string;
  limit?: number;
  skip?: number;
}) => {
  const pool = await getDBConnection();
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (search) {
    const wildcard = `%${search}%`;
    whereClauses.push(`(storeName LIKE ?)`);
    values.push(wildcard);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Stores ${whereSQL}  ${
    (limit || skip) && `LIMIT ${limit} OFFSET ${skip}`
  }`;
  const [result] = await pool.execute(sql, values);
  return result;
};

export const selectStoresByEmpKeyFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<EmployeeInterface>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT s.* FROM Stores s
LEFT JOIN Employees e ON e.storeId = s.storeId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND e.${key} IS NULL`;
    } else {
      sql += ` AND e.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

// export selectStoresByUserId

export const selectStoresByPoId = async (poId: number) => {
  const pool = await getDBConnection();

  const sql = `
  SELECT * FROM Stores s
  LEFT JOIN RequestOrders ro ON ro.storeId = s.storeId
  LEFT JOIN PurchaseOrderRequest por ON por.requestId = ro.requestId
  LEFT JOIN PurchaseOrders po ON po.poId = por.poId
  WHERE po.poId = ?`;
  const [rows] = await pool.execute(sql, [poId]);
  return rows;
};
