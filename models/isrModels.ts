import {
  CreateISRDto,
  CreateISRPurchaserDto,
  DisplayISRPurchaserDTO,
} from "@/dtos/isr.dto";
import { getDBConnection } from "@/lib/db";
import { InterStoreRequests, ISRPurchasers } from "@/types/isr";
import {
  PoolClusterOptions,
  PoolConnection,
  ResultSetHeader,
  RowDataPacket,
} from "mysql2/promise";

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

export const insertISRPurchaser = async ({
  data,
  connection,
}: {
  data: CreateISRPurchaserDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ISRPurchasers(isrId,userid,isrPurCreatedBy) VALUES(?,?,?)`;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.isrId,
    data.userId,
    data.isrPurCreatedBy,
  ]);

  return result.insertId;
};

export const selectISRPurchaser = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRPurchasers, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = ` SELECT
    isrp.isrPurId,
    isrp.userId,
    isrp.isrId,
    isrp.isrPurCreatedAt,
    isrp.isrPurCreatedBy,
    isrp.isrPurUpdatedat,
    CONCAT(uc.userfname, ' ', uc.userLname) AS creator,
    CONCAT(u.userfname, ' ', u.userLname) AS purchaser
FROM ISRPurchasers isrp
LEFT JOIN InterStoreRequests isr ON isr.isrId = isrp.isrId
LEFT JOIN Users u
    ON u.userId = isrp.userId
    LEFT JOIN Users uc ON uc.userId = isrp.isrPurCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrp.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  if (code) {
    sql += ` AND isr.isrCode = ?`;
    params.push(code);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as DisplayISRPurchaserDTO[];
};

export const selectCountISRPurchaser = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRPurchasers, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `SELECT
    COUNT(isrp.isrPurid) as count
FROM ISRPurchasers isrp
LEFT JOIN InterStoreRequests isr ON isr.isrId = isrp.isrId
LEFT JOIN Users u
    ON u.userId = isrp.userId
    LEFT JOIN Users uc ON uc.userId = isrp.isrPurCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrp.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  if (code) {
    sql += ` AND isr.isrCode = ?`;
    params.push(code);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows[0].count;
};
