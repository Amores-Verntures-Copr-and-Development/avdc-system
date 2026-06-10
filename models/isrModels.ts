import {
  CreateISRDto,
  CreateISRPurchaserDto,
  CreateISRRequestHandlerDto,
  CreateISRStoreDto,
  DisplayISRPurchaserDTO,
  DisplayISRRequestHandlerDTO,
  DisplayISRStoresDTO,
} from "@/dtos/isr.dto";
import { getDBConnection } from "@/lib/db";
import {
  InterStoreRequests,
  ISRPurchasers,
  ISRRequestHandlers,
  ISRStores,
} from "@/types/isr";
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
    } else if (value === "NOTNULL") {
      sql += ` AND isrp.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrp.${key} = ?`;
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
    } else if (value === "NOTNULL") {
      sql += ` AND isrp.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrp.${key} = ?`;
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

export const updateISRPurchaser = async ({
  connection,
  updates,
  keyFields = ["isrPurId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRPurchasers>[];
  keyFields?: (keyof ISRPurchasers)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ISRPurchasers),
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
    UPDATE ISRPurchasers
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const insertISRRequestHandler = async ({
  data,
  connection,
}: {
  data: CreateISRRequestHandlerDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ISRRequestHandlers(isrId,userid,isrReqHanCreatedBy) VALUES(?,?,?)`;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.isrId,
    data.userId,
    data.isrReqHanCreatedBy,
  ]);

  return result.insertId;
};

export const selectISRRequestHandler = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRRequestHandlers, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `  SELECT isrh.isrReqHanId, isrh.userId, isrh.isrId, isrh.isrReqHanCreatedBy, isrh.isrReqHanCreatedAt,    
 CONCAT(uc.userfname, ' ', uc.userLname) AS creator,
CONCAT(u.userfname, ' ', u.userLname) AS requestHandler FROM  ISRRequestHandlers isrh
 LEFT JOIN InterStoreRequests isr ON isr.isrId = isrh.isrId
 LEFT JOIN Users u ON u.userId = isrh.userId
 LEFT JOIN Users uc ON uc.userId = isrh.isrReqHanCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrh.${key} IS NULL`;
    } else if (value === "NOTNULL") {
      sql += ` AND isrh.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrh.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrh.${key} = ?`;
      params.push(value);
    }
  }
  if (code) {
    sql += ` AND isr.isrCode = ?`;
    params.push(code);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as DisplayISRRequestHandlerDTO[];
};

export const selectCountISRRequestHandler = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRRequestHandlers, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = `  SELECT COUNT(isrh.isrReqHanId) as count FROM  ISRRequestHandlers isrh
 LEFT JOIN InterStoreRequests isr ON isr.isrId = isrh.isrId
 LEFT JOIN Users u ON u.userId = isrh.userId
 LEFT JOIN Users uc ON uc.userId = isrh.isrReqHanCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrh.${key} IS NULL`;
    } else if (value === "NOTNULL") {
      sql += ` AND isrh.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrh.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrh.${key} = ?`;
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

export const updateISRRequestHandlerModel = async ({
  connection,
  updates,
  keyFields = ["isrReqHanId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRRequestHandlers>[];
  keyFields?: (keyof ISRRequestHandlers)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ISRRequestHandlers),
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
    UPDATE ISRRequestHandlers
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};

export const insertISRStore = async ({
  data,
  connection,
}: {
  data: CreateISRStoreDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO ISRStores(isrId,storeId,isrStoreCreatedBy) VALUES(?,?,?)`;

  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.isrId,
    data.storeId,
    data.isrStoreCreatedBy,
  ]);

  return result.insertId;
};

export const selectISRStore = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRStores, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = ` SELECT isrs.isrStoreId,isrs.isrId,isrs.isrStoreCreatedBy,isrs.isrStoreCreatedAt,s.storeName, CONCAT(u.userfname, ' ', u.userLname) AS creator 
FROM ISRStores isrs
LEFT JOIN InterStoreRequests isr ON isr.isrId = isrs.isrId
LEFT JOIN Stores s ON s.storeId = isrs.storeId
 LEFT JOIN Users u ON u.userId = isrs.isrStoreCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrs.${key} IS NULL`;
    } else if (value === "NOTNULL") {
      sql += ` AND isrs.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrs.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrs.${key} = ?`;
      params.push(value);
    }
  }
  if (code) {
    sql += ` AND isr.isrCode = ?`;
    params.push(code);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows as DisplayISRStoresDTO[];
};

export const selectCountISRStore = async ({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRStores, any>>;
  code?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();

  let sql = ` SELECT COUNT(isrs.isrStoreId) as count
FROM ISRStores isrs
LEFT JOIN InterStoreRequests isr ON isr.isrId = isrs.isrId
LEFT JOIN Stores s ON s.storeId = isrs.storeId
 LEFT JOIN Users u ON u.userId = isrs.isrStoreCreatedBy
 WHERE 1=1`;
  const params: any[] = [];

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND isrs.${key} IS NULL`;
    } else if (value === "NOTNULL") {
      sql += ` AND isrs.${key} IS NOT NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        sql += ` AND isrs.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      sql += ` AND isrs.${key} = ?`;
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

export const selectStoreNotInISR = async ({
  keyFields = {},
  connection,
  limit,
  search,
}: {
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
  connection?: PoolConnection;
  limit: number;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: string[] = [];
  let whereISR: string = "";

  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      whereISR += ` AND isr.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        whereISR += ` AND isr.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      whereISR += ` AND isr.${key} = ?`;
      params.push(value);
    }
  }
  let sql = ` 
SELECT s.storeId,s.storeName FROM Stores s
WHERE s.storeId NOT IN (
 SELECT storeId FROM ISRStores isrs
 LEFT JOIN InterStoreRequests isr ON isr.isrId = isrs.isrId  WHERE 1 = 1 AND isrs.isrStoreDeletedAt IS NULL ${whereISR}
)
   `;

  if (search) {
    sql += ` AND
    (
      s.storeName LIKE ?
    
    )
  `;

    params.push(`%${search}%`);
  }
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const updateISRStoresModel = async ({
  connection,
  updates,
  keyFields = ["isrStoreId"],
}: {
  connection?: PoolConnection;
  updates: Partial<ISRStores>[];
  keyFields?: (keyof ISRStores)[];
}) => {
  const pool = connection ?? (await getDBConnection());
  if (!updates || updates.length === 0) return;

  const updateFields = Object.keys(updates[0]).filter(
    (field) => !keyFields.includes(field as keyof ISRStores),
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
    UPDATE ISRStores
    SET ${setClauses.join(", ")}
    WHERE ${whereSql};
  `;
  const [result] = await pool.execute(sql, params);
  return result;
};
