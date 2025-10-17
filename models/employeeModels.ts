import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { getDBConnection } from "../lib/db";
import { CreateEmployeeDto } from "@/dtos/user.dto";

export const insertEmployee = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateEmployeeDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Employees(empPosition,storeId,userId) 
                VALUES(?,?,?)`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.empPosition,
    data.storeId,
    data.userId,
  ]);
  return result.insertId;
};
