import { CreateUserDto } from "@/dtos/user.dto";
import { UserInterface } from "@/types/users";
import { getDBConnection } from "../lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

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
export const selectUsers = async ({ userName }: { userName?: string }) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (userName) {
    whereClauses.push(`u.userName = ?`);
    values.push(userName);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const pool = await getDBConnection();
  const sql = `
        SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,e.empPosition, e.empId,u.userAddedBy,u.userCreatedAt,
        CONCAT_WS(' ', us.userFname, us.userLname) AS addedBy
        FROM Users u LEFT JOIN Employees e ON e.userId = u.userId LEFT JOIN Users us ON us.userId = u.userAddedBy ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
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
        SELECT u.userId,u.userName,u.userFname,u.userLname,u.userRole,u.userEmail,u.userStatus,e.empPosition,u.userPassword,s.storeId FROM Users u LEFT JOIN Employees e ON e.userId = u.userId 
        LEFT JOIN Stores s ON s.storeId = e.storeId  ${whereSQL}`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, values);
  return rows;
};
export const updateUser = async () => {};
export const deleteUser = async () => {};

export const selectPurchaserNotInStockPurchaser = async () => {
  const pool = await getDBConnection();
  const sql = `SELECT * FROM Users u
LEFT JOIN Employees e ON e.userId = u.userId
LEFT JOIN StockPurchasers sp ON u.userId = sp.userId
WHERE sp.stockRoomId IS NULL`;
  const [rows] = await pool.execute(sql);
  return rows;
};
