import { CreateUserDto, UpdateUserInfoDto } from "@/dtos/user.dto";
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
  const sql = `INSERT INTO Users(userName,userFname,userLname,userMname,userPassword,userRole,userEmail,userAddedBy,companyId)
                VALUES(?,?,?,?,?,?,?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.userName,
    data.userFname,
    data.userLname,
    data.userMname,
    data.userPassword,
    data.userRole,
    data.userEmail,
    data.userAddedBy,
    data.companyId ?? null,
  ]);
  return result.insertId;
};
export const selectUsers = async ({
  userName,
  search,
  companyId,
  excludeEmpPositions,
  storeId,
}: {
  userName?: string;
  search?: string;
  companyId?: number | null;
  // Positions to hide entirely from the result (e.g. "staff" on the
  // Employees page) - not used by the Users admin page, which lists
  // everyone regardless of position.
  excludeEmpPositions?: string[];
  // Scopes results to employees assigned (via StoreEmployees) to this
  // store - used for a supervisor, who should only see their own store's
  // employees rather than the whole company.
  storeId?: number;
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
  if (companyId !== undefined) {
    if (companyId === null) {
      whereClauses.push(`u.companyId IS NULL`);
    } else {
      whereClauses.push(`u.companyId = ?`);
      values.push(companyId);
    }
  }
  if (excludeEmpPositions && excludeEmpPositions.length > 0) {
    whereClauses.push(
      `(e.empPosition IS NULL OR e.empPosition NOT IN (${excludeEmpPositions.map(() => "?").join(",")}))`,
    );
    values.push(...excludeEmpPositions);
  }
  if (storeId) {
    whereClauses.push(
      `EXISTS (SELECT 1 FROM StoreEmployees se WHERE se.empId = e.empId AND se.storeId = ?)`,
    );
    values.push(storeId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const pool = await getDBConnection();
  const sql = `
        SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,u.companyId,co.companyName,e.empPosition, e.empId,u.userAddedBy,u.userCreatedAt,
        CONCAT_WS(' ', us.userFname, us.userLname) AS addedBy,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('storeId', se.storeId, 'storeName', s.storeName)
          )
          FROM StoreEmployees se
          LEFT JOIN Stores s ON s.storeId = se.storeId
          WHERE se.empId = e.empId
        ) AS storeEmployees
        FROM Users u
        LEFT JOIN Employees e ON e.userId = u.userId
        LEFT JOIN Users us ON us.userId = u.userAddedBy
        LEFT JOIN Companies co ON co.companyId = u.companyId
        ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);

  return rows;
};

export const selectCompanyOwners = async ({
  companyId,
}: {
  companyId: number;
}) => {
  const pool = await getDBConnection();
  const sql = `
    SELECT userId, userFname, userLname, userEmail, userStatus, userCreatedAt
    FROM Users
    WHERE companyId = ? AND userRole = 'owner'
    ORDER BY userCreatedAt DESC
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [companyId]);
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
          SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,u.companyId,e.empPosition,u.userPassword,(
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
export const updateUserInfo = async ({
  userId,
  data,
}: {
  userId: number;
  data: UpdateUserInfoDto;
}) => {
  const pool = await getDBConnection();
  const sql = `UPDATE Users SET userFname = ?, userMname = ?, userLname = ?, userEmail = ? WHERE userId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.userFname,
    data.userMname,
    data.userLname,
    data.userEmail,
    userId,
  ]);
  return result;
};

export const updateUserPassword = async ({
  userId,
  hashedPassword,
}: {
  userId: number;
  hashedPassword: string;
}) => {
  const pool = await getDBConnection();
  const sql = `UPDATE Users SET userPassword = ? WHERE userId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    hashedPassword,
    userId,
  ]);
  return result;
};

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
    WHERE 1 = 1 AND isrpur.isrPurDeletedAt IS NULL ${whereISR}
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
    WHERE 1 = 1 AND isrh.isrReqHanDeletedAt IS NULL

    UNION

    SELECT isrpur.userId
    FROM ISRPurchasers isrpur
    LEFT JOIN InterStoreRequests isrp 
        ON isrp.isrId = isrpur.isrId
    WHERE 1 = 1 AND isrpur.isrPurDeletedAt IS NULL ${whereISR}
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
