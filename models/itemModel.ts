import { CreateItemDto } from "@/dtos/items.dto";
import { ResultSetHeader } from "mysql2/promise";
import { getDBConnection } from "../lib/db";
import { PoolConnection } from "mysql2/promise";

export const insertItem = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateItemDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Items(itemName,itemDescription,itemPrice,itemUnit,itemAddedBy,categoryId) 
  VALUES(?,?,?,?,?,?)  `;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.itemName,
    data.itemDescription,
    data.itemPrice,
    data.itemUnit,
    data.itemAddedBy,
    data.categoryId,
  ]);
  return results.insertId;
};

export const selectItems = async ({
  connection,
  search,
}: {
  connection?: PoolConnection;
  search?: string;
}) => {
  const whereClauses: string[] = [];
  const values: string[] = [];
  const pool = connection ? connection : await getDBConnection();
  if (search) {
    const wildcard = `%${search}%`;
    whereClauses.push(`(itemName LIKE ?)`);
    values.push(wildcard);
  }

  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Items ${whereSQL}`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};
