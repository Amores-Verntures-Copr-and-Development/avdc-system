import {
  CreateStockPurchaser,
  CreateStockRoom,
  CreateStockStore,
} from "@/dtos/stockRoom.dto";
import { getDBConnection } from "@/lib/db";
import { StockPurchasers, StockRoom, StockStores } from "@/types/stockRoom";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertStockRoom = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateStockRoom;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO StockRooms(stockRoomName,stockRoomDescription,stockRoomLocation,stockRoomCreatedBy) VALUES(?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.stockRoomName,
    data.stockRoomDescription,
    data.stockRoomLocation,
    data.stockRoomCreatedBy,
  ]);
  return result.insertId;
};

export const selectStockRoomSSFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockPurchasers>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT sr.* FROM StockRooms sr 
LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sp.${key} IS NULL`;
    } else {
      sql += ` AND sp.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectStockRoomSPFields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockPurchasers>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT sr.* FROM StockRooms sr 
LEFT JOIN StockPurchasers sp ON sp.stockRoomId = sr.stockRoomId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sp.${key} IS NULL`;
    } else {
      sql += ` AND sp.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as StockRoom[];
};

export const selectStockRoom = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT * FROM StockRooms WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    const tableAlias = [
      "inventoryId",
      "inventoryItemId",
      "inventoryItemReferenceId",
    ].includes(key)
      ? "ii"
      : key === "storeId"
      ? "i"
      : key === "categoryId"
      ? "c"
      : "it";

    if (value === null) {
      sql += ` AND ${tableAlias}.${key} IS NULL`;
    } else {
      sql += ` AND ${tableAlias}.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};
export const selectStockStoresBySSKeyfields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockStores>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT s.* FROM Stores s 
LEFT JOIN StockStores ss ON s.storeId = ss.storeId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ss.${key} IS NULL`;
    } else {
      sql += ` AND ss.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows;
};

export const selectStockStoresByStockRoomKeyfields = async ({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) => {
  const pool = await getDBConnection();
  let sql = `
SELECT s.*, ss.stockStoresCreatedAt,ss.stockStoresId,ss.stockRoomId,ss.stockStoresUpdatedAt,ss.stockStoresDeletedAt FROM Stores s 
LEFT JOIN StockStores ss ON s.storeId = ss.storeId
LEFT JOIN StockRooms sr ON sr.stockRoomId = ss.stockRoomId
WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND sr.${key} IS NULL`;
    } else {
      sql += ` AND sr.${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const insertStockStores = async ({
  data,
  connection,
}: {
  connection?: PoolConnection;
  data: CreateStockStore[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO StockStores(stockStoresAddedBy,stockRoomId,storeId) VALUES ${data
    .map(() => "(?,?,?)")
    .join(", ")}`;

  const values = data.flatMap((stores) => [
    stores.stockStoresAddedBy,
    stores.stockRoomId,
    stores.storeId,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};
export const insertStockPurchasers = async ({
  data,
  connection,
}: {
  connection?: PoolConnection;
  data: CreateStockPurchaser[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO StockPurchasers(stockRoomId,userId,stockPurchaserAddedBy) VALUES ${data
    .map(() => "(?,?,?)")
    .join(", ")}`;

  const values = data.flatMap((stores) => [
    stores.stockRoomId,
    stores.userId,
    stores.stockPurchaserAddedBy,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectStockPurchaser = async ({
  stockPurchaserFields,
}: {
  stockPurchaserFields?: Partial<StockPurchasers>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT * FROM StockPurchasers sp 
LEFT JOIN Users u ON u.userId = sp.userId
LEFT JOIN Employees e ON e.userId = u.userId
WHERE 1=1`;
  const params: any[] = [];
  if (stockPurchaserFields) {
    for (const [key, value] of Object.entries(stockPurchaserFields)) {
      if (value === null) {
        sql += ` AND sp.${key} IS NULL`;
      } else {
        sql += ` AND sp.${key} = ?`;
        params.push(value);
      }
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};
