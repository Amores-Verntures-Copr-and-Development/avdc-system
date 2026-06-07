import { CreateISRDto } from "@/dtos/isr.dto";
import { getDBConnection } from "@/lib/db";
import { InterStoreRequests } from "@/types/isr";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertISR = async ({
  data,
  connection,
}: {
  data: CreateISRDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO InterStoreRequests (isrCode, isrName, isrCreatedBy) VALUES (?, ?, ?)`;
  const values = [data.isrCode, data.isrName, data.isrCreatedBy];

  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectISR = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT * FROM InterStoreRequests WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as InterStoreRequests[];
};

export const selectISRCount = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT COUNT(*) as count FROM InterStoreRequests WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND ${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows[0].count as number;
};
