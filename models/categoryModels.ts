import { CreateStoreDto } from "@/dtos/store.dto";
import { getDBConnection } from "../lib/db";
import { CreateCategoryDto } from "@/dtos/category.dto";
import { CategoryInterface } from "@/types/categories";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCategory = async (data: CreateCategoryDto) => {
  const pool = await getDBConnection();
  const sql = `INSERT INTO Categories(categoryName,categoryType,categoryCreatedBy,categoryReferenceType,categoryReferenceId) VALUES(?,?,?,?,?)`;
  const [rows] = await pool.execute(sql, [
    data.categoryName,
    data.categoryType,
    data.categoryCreatedBy,
    data.categoryReferenceType,
    data.categoryReferenceId,
  ]);
  return rows;
};

export const selectCategories = async ({
  keyFields = {},
  connection,
}: {
  keyFields?: Partial<CategoryInterface>;
  connection?: PoolConnection;
}): Promise<CategoryInterface[]> => {
  const pool = connection ? connection : await getDBConnection();
  console.log({ keyFields });
  const params: any[] = [];
  let sql = `SELECT * FROM Categories WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as CategoryInterface[];
};

export const selectCategoriesById = async ({
  stockRoomId,
  storeId,
}: {
  stockRoomId?: number;
  storeId?: number;
}) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  const pool = await getDBConnection();
  if (stockRoomId) {
    whereClauses.push(
      `categoryReferenceId = ? AND categoryReferenceType = "stock-room"`
    );
    values.push(stockRoomId);
  }
  if (storeId) {
    whereClauses.push(
      `categoryReferenceId = ? AND categoryReferenceType = "stores"`
    );
    values.push(storeId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Categories ${whereSQL}`;
  const [result] = await pool.execute(sql, values);
  return result;
};
