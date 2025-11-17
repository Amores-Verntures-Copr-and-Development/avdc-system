import { CreateStoreDto } from "@/dtos/store.dto";
import { getDBConnection } from "../lib/db";
import { CreateCategoryDto } from "@/dtos/category.dto";

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
  categoryType,
}: {
  categoryType?: string;
}) => {
  const whereClauses: string[] = [];
  const values: any[] = [];
  const pool = await getDBConnection();
  if (categoryType) {
    whereClauses.push(`categoryType = ?`);
    values.push(categoryType);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Categories ${whereSQL}`;
  const [result] = await pool.execute(sql, values);
  return result;
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
