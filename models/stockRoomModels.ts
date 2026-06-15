import {
  CreateStockPurchaser,
  CreateStockRoom,
  CreateStockRoomUserDTO,
  CreateStockStore,
  DisplayStockRoomUserDTO,
} from "@/dtos/stockRoom.dto";
import { getDBConnection } from "@/lib/db";
import {
  StockPurchasers,
  StockRoom,
  StockRoomUsers,
  StockStores,
} from "@/types/stockRoom";
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
  let sql = `SELECT sr.*, COUNT(ii.inventoryItemId) AS totalItems FROM StockRooms sr
LEFT JOIN Inventories i ON i.inventoryReferenceId = sr.stockRoomId AND i.inventoryReference = 'stock-room'
LEFT JOIN InventoryItems ii ON ii.inventoryId = i.inventoryId AND ii.inventoryItemDeletedAt IS NULL WHERE 1=1`;
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

  sql += ` GROUP BY sr.stockRoomId`;
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

export const insertStockRoomUserBulk = async ({
  data,
  connection,
}: {
  connection?: PoolConnection;
  data: CreateStockRoomUserDTO[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }

  const pool = connection ?? (await getDBConnection());

  const sql = `
    INSERT INTO StockRoomUsers (
      userId,
      stockRoomId,
      srUserAddedBy
    )
    VALUES ${data.map(() => "(?,?,?)").join(",")}
    ON DUPLICATE KEY UPDATE
      srUserDeletedAt = NULL,
      srUserAddedBy = VALUES(srUserAddedBy),
      srUserUpdatedAt = CURRENT_TIMESTAMP
  `;

  const values = data.flatMap((row) => [
    row.userId,
    row.stockRoomId,
    row.srUserAddedBy,
  ]);

  const [results] = await pool.execute<ResultSetHeader>(sql, values);

  return results;
};
export const insertStockRoomUser = async ({
  payload,
  connection,
}: {
  payload: CreateStockRoomUserDTO;
  connection?: PoolConnection;
}): Promise<number> => {
  const pool = connection ?? (await getDBConnection());

  const [result] = await pool.execute<ResultSetHeader>(
    `
      INSERT INTO StockRoomUsers (
        userId,
        stockRoomId,
        srUserAddedBy
      )
      VALUES (?, ?, ?)
    `,
    [payload.userId, payload.stockRoomId, payload.srUserAddedBy],
  );

  return result.insertId;
};

export const updateStockRoomUsers = async ({
  data,
  keyFields = ["srUserId"],
  connection,
}: {
  data: Partial<StockRoomUsers>[];
  keyFields: (keyof StockRoomUsers)[];
  connection?: PoolConnection;
}): Promise<ResultSetHeader> => {
  if (!data.length) {
    throw new Error("No data supplied for update.");
  }

  const pool = connection ?? (await getDBConnection());

  const updateFields = Object.keys(data[0]).filter(
    (field) => !keyFields.includes(field as keyof StockRoomUsers),
  );

  const params: any[] = [];
  const setClauses: string[] = [];

  for (const field of updateFields) {
    let caseStatement = `${field} = CASE`;

    for (const row of data) {
      const keyConditions = keyFields
        .map((key) => {
          params.push(row[key]);
          return `${String(key)} = ?`;
        })
        .join(" AND ");

      caseStatement += ` WHEN ${keyConditions} THEN ?`;
      params.push((row as any)[field]);
    }

    caseStatement += ` ELSE ${field} END`;
    setClauses.push(caseStatement);
  }

  const whereConditions = data
    .map((row) => {
      const condition = `(${keyFields
        .map((key) => {
          params.push(row[key]);
          return `${String(key)} = ?`;
        })
        .join(" AND ")})`;

      return condition;
    })
    .join(" OR ");

  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE StockRoomUsers
      SET
        ${setClauses.join(", ")},
        srUserUpdatedAt = CURRENT_TIMESTAMP
      WHERE ${whereConditions}
    `,
    params,
  );

  return result;
};
export const deleteStockRoomUsers = async ({
  data,
  keyFields = ["srUserId"],
  connection,
}: {
  data: Partial<StockRoomUsers>[];
  keyFields?: (keyof StockRoomUsers)[];
  connection?: PoolConnection;
}): Promise<ResultSetHeader> => {
  if (!data.length) {
    throw new Error("No data supplied for delete.");
  }

  const pool = connection ?? (await getDBConnection());

  const params: any[] = [];

  const whereConditions = data
    .map((row) => {
      const condition = `(${keyFields
        .map((key) => {
          params.push(row[key]);
          return `${String(key)} = ?`;
        })
        .join(" AND ")})`;

      return condition;
    })
    .join(" OR ");

  const [result] = await pool.execute<ResultSetHeader>(
    `
      UPDATE StockRoomUsers
      SET srUserDeletedAt = CURRENT_TIMESTAMP
      WHERE ${whereConditions}
    `,
    params,
  );

  return result;
};

export const selectStockRoomUsersByFields = async ({
  fields,
  arrayFields,
  connection,
}: {
  fields?: Partial<StockRoomUsers>;
  arrayFields?: Partial<Record<keyof StockRoomUsers, any[]>>;
  connection?: PoolConnection;
}): Promise<DisplayStockRoomUserDTO[]> => {
  const pool = connection ?? (await getDBConnection());

  const whereClauses: string[] = ["sru.srUserDeletedAt IS NULL"];
  const params: any[] = [];

  Object.entries(fields ?? {}).forEach(([key, value]) => {
    if (value !== undefined) {
      whereClauses.push(`sru.${key} = ?`);
      params.push(value);
    }
  });

  Object.entries(arrayFields ?? {}).forEach(([key, values]) => {
    if (values?.length) {
      whereClauses.push(`sru.${key} IN (${values.map(() => "?").join(",")})`);
      params.push(...values);
    }
  });

  const [rows] = await pool.execute<RowDataPacket[]>(
    `
      SELECT
        sru.*,
        u.userId,
        u2.userId AS addedByUserId,
        sr.stockRoomId,
        CONCAT(u2.userFname,' ',u2.userLname) as srAddedByName,
        CONCAT(u.userFname,' ',u.userLname) as srUserName
      FROM StockRoomUsers sru
      LEFT JOIN Users u
        ON u.userId = sru.userId
      LEFT JOIN Users u2
        ON u2.userId = sru.srUserAddedBy
      LEFT JOIN StockRooms sr
        ON sr.stockRoomId = sru.stockRoomId
      WHERE ${whereClauses.join(" AND ")}
    `,
    params,
  );

  return rows as DisplayStockRoomUserDTO[];
};

export const selectStockRoomUserNotInByID = async ({
  stockRoomId,
  connection,
}: {
  stockRoomId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT u.userId,u.userFname,u.userLname FROM Users u 
WHERE u.userId NOT IN (
	SELECT sru.userId FROM StockRoomUsers sru WHERE sru.stockRoomId = ? AND sru.srUserDeletedAt IS NULL
)
  LIMIT 20`;
  const [rows] = await pool.execute(sql, [stockRoomId]);

  return rows;
};
