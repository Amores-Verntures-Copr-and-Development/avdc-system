import { CreateUserDto } from "@/dtos/user.dto";
import { UserInterface } from "@/types/users";
import { getDBConnection } from "../lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { InterStoreRequests } from "@/types/isr";

export const insertUser = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateUserDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Users(userName,userFname,userLname,userMname,userPassword,userRole,userEmail,userAddedBy) 
                VALUES(?,?,?,?,?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.userName,
    data.userFname,
    data.userLname,
    data.userMname,
    data.userPassword,
    data.userRole,
    data.userEmail,
    data.userAddedBy,
  ]);
  return result.insertId;
};
export const selectUsers = async ({
  userName,
  search,
}: {
  userName?: string;
  search?: string;
}) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (userName) {
    whereClauses.push(`u.userName = ?`);
    values.push(userName);
  }
  if (search) {
    whereClauses.push(`u.userFname LIKE ? OR u.userLname LIKE ?`);
    values.push(`%${search}%`, `%${search}%`);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const pool = await getDBConnection();
  const sql = `
        SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,e.empPosition, e.empId,u.userAddedBy,u.userCreatedAt,
        CONCAT_WS(' ', us.userFname, us.userLname) AS addedBy
        FROM Users u LEFT JOIN Employees e ON e.userId = u.userId LEFT JOIN Users us ON us.userId = u.userAddedBy ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);

  console.log("selectUsers result:", rows);
  return rows;
};

export const selectUser = async ({ userName }: { userName?: string }) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (userName) {
    whereClauses.push(`userName = ?`);
    values.push(userName);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const pool = await getDBConnection();
  const sql = `
          SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,e.empPosition,u.userPassword,(
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'storeEmpId', se.storeEmpId,
        'storeId', se.storeId,
        'empId', se.empId,
        'storeName', s.storeName,
        'storeLocation', s.storeLocation,
        'storeContactPhone', s.storePhone,
        'storeEmail', s.storeEmail
      )
    )
    FROM StoreEmployees se 
    LEFT JOIN Stores s ON s.storeId = se.storeId 
    WHERE se.empId = e.empId
  ) as storeEmployees 
  FROM Users u LEFT JOIN Employees e ON e.userId = u.userId ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows;
};
export const updateUser = async () => {};
export const deleteUser = async () => {};

export const selectPurchaserNotInStockPurchaser = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT u.* FROM Users u
LEFT JOIN Employees e ON e.userId = u.userId
LEFT JOIN StockPurchasers sp ON u.userId = sp.userId
WHERE sp.stockRoomId IS NULL`;
  const [rows] = await pool.execute(sql);
  return rows;
};

export const selectUserInfo = async (userId: number) => {
  const pool = await getDBConnection();
  const sql = ` SELECT 
  u.userId,
  u.userName,
  u.userFname, 
  u.userLname, 
  u.userMname, 
  u.userRole, 
  u.userEmail, 
  u.userStatus, 
  u.userUpdatedAt, 
  u.userCreatedAt, 
  u.userDeletedAt,
  e.*,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'storeEmpId', se.storeEmpId,
        'storeId', se.storeId,
        'empId', se.empId,
        'storeName', s.storeName,
        'storeLocation', s.storeLocation,
        'storeContactPhone', s.storePhone,
        'storeEmail', s.storeEmail
      )
    )
    FROM StoreEmployees se 
    LEFT JOIN Stores s ON s.storeId = se.storeId 
    WHERE se.empId = e.empId
  ) as storeEmployees 
FROM Users u
LEFT JOIN Employees e ON e.userId = u.userId 
WHERE u.userId = ?`;
  const [rows] = await pool.execute(sql, [userId]);
  return rows;
};

export const selectStoreSuperVisorWithHasPassword = async ({
  storeId,
  connection,
}: {
  storeId: number;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT u.userId,u.userPassword FROM StoreEmployees se
  LEFT JOIN Employees e ON e.empId = se.empId
  LEFT JOIN Users u ON u.userId = e.userId
  WHERE se.storeId = ? AND e.empPosition = 'supervisor'`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [storeId]);
  return rows;
};

export const selectUserWithUserId = async ({
  userId,
  connection,
}: {
  userId: number;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT * FROM Users WHERE userId = ? `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [userId]);
  return rows;
};

export const selectUserNotInISRPurchaser = async ({
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
      whereISR += ` AND isrp.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        whereISR += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      whereISR += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  let sql = `SELECT u.userId,CONCAT(u.userFname," ",u.userLname) as fullName,u.userRole
FROM Users u
WHERE u.userId NOT IN (
SELECT userId
       FROM ISRRequestHandlers isrh
    LEFT JOIN InterStoreRequests isrp 
        ON isrp.isrId = isrh.isrId
    WHERE 1 = 1

    UNION

    SELECT isrpur.userId
    FROM ISRPurchasers isrpur
    LEFT JOIN InterStoreRequests isrp 
        ON isrp.isrId = isrpur.isrId
    WHERE 1 = 1 ${whereISR}
)`;

  if (search) {
    sql += ` AND
    (
      u.userFname LIKE ?
      OR u.userLname LIKE ?
      OR CONCAT(u.userFname, ' ', u.userLname) LIKE ?
    )
  `;

    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows;
};

export const selectUserNotInISRRequestHandler = async ({
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
      whereISR += ` AND isrp.${key} IS NULL`;
    } else if (Array.isArray(value)) {
      // multiple values
      if (value.length > 0) {
        whereISR += ` AND isrp.${key} IN (${value.map(() => "?").join(", ")})`;
        params.push(...value);
      }
    } else {
      // single value
      whereISR += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  let sql = `SELECT u.userId,CONCAT(u.userFname," ",u.userLname) as fullName,u.userRole
FROM Users u
WHERE u.userId NOT IN (
SELECT isrh.userId
    FROM ISRRequestHandlers isrh
    LEFT JOIN InterStoreRequests isrp 
        ON isrp.isrId = isrh.isrId
    WHERE 1 = 1

    UNION

    SELECT isrpur.userId
    FROM ISRPurchasers isrpur
    LEFT JOIN InterStoreRequests isrp 
        ON isrp.isrId = isrpur.isrId
    WHERE 1 = 1 ${whereISR}
)`;

  if (search) {
    sql += ` AND
    (
      u.userFname LIKE ?
      OR u.userLname LIKE ?
      OR CONCAT(u.userFname, ' ', u.userLname) LIKE ?
    )
  `;

    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }

  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);

  return rows;
};
