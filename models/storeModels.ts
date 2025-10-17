import { CreateStoreDto } from "@/dtos/store.dto";
import { getDBConnection } from "../lib/db";
import { skip } from "node:test";

export const insertStore = async (data: CreateStoreDto) => {
  const pool = await getDBConnection();
  const sql = `INSERT INTO Stores(storeName,storeLocation,storeDescription,storeCreatedBy) VALUES(?,?,?,?)`;
  const [rows] = await pool.execute(sql, [
    data.storeName,
    data.storeLocation,
    data.storeDescription,
    data.storeCreatedBy,
  ]);
  return rows;
};

export const selectStores = async ({
  search,
  limit,
  skip,
}: {
  search?: string;
  limit?: number;
  skip?: number;
}) => {
  const pool = await getDBConnection();
  const whereClauses: string[] = [];
  const values: any[] = [];
  if (search) {
    const wildcard = `%${search}%`;
    whereClauses.push(`(storeName LIKE ?)`);
    values.push(wildcard);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT * FROM Stores ${whereSQL}  ${
    (limit || skip) && `LIMIT ${limit} OFFSET ${skip}`
  }`;
  const [result] = await pool.execute(sql, values);
  return result;
};
