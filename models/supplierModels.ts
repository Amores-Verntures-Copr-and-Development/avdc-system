import {
  CreateSupplierDto,
  CreateSupplierItemDto,
  CreateSupplierItemPriceDto,
} from "@/dtos/supplier.dto";
import { getDBConnection } from "@/lib/db";
import { Supplier, SupplierItem, SupplierItemPrices } from "@/types/supplier";
import { PoolConnection, RowDataPacket } from "mysql2/promise";

export const insertSupplier = async ({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateSupplierDto;
}) => {
  const pool = connection ? connection : await getDBConnection();

  const sql = `INSERT INTO Suppliers(suppCode,suppName,suppContactPerson,suppEmail,suppAddress,suppPhone,suppCreatedBy) 
  VALUES(?,?,?,?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.suppCode,
    data.suppName,
    data.suppContactPerson,
    data.suppEmail,
    data.suppAddress,
    data.suppPhone,
    data.suppCreatedBy,
  ]);
  return results;
};

export const selectCountSupplier = async (connection: PoolConnection) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT COUNT(*) as total FROM Suppliers`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql);
  return rows[0];
};

export const selectSupplier = async ({
  connection,
  keyFields = {},
  search,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Supplier>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM Suppliers WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  if (search) {
    sql += ` AND (suppName LIKE ? OR suppCode LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Supplier[];
};

export const insertSupplierItem = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSupplierItemDto;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SupplierItems(suppId,itemId,suppItemPrice,suppItemCreatedBy) VALUES(?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    data.suppId,
    data.itemId,
    data.suppItemPrice,
    data.suppItemCreatedBy,
  ]);
  return results;
};

export const insertSupplierItems = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSupplierItemDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SupplierItems(suppId,itemId,suppItemPrice,suppItemCreatedBy) 
  VALUES ${data.map(() => "(?,?,?,?)")}`;
  const values = data.flatMap((item) => [
    item.suppId,
    item.itemId,
    item.suppItemPrice,
    item.suppItemCreatedBy,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectSupplierItems = async ({
  suppId,
  search,
}: {
  suppId?: number;
  search?: string;
}) => {
  const pool = await getDBConnection();
  let whereClauses: string[] = [];
  let values: any[] = [];
  if (suppId) {
    whereClauses.push("si.suppId = ?");
    values.push(suppId);
  }
  if (search) {
    const wildcard = `%${search}%`;
    whereClauses.push("i.itemName LIKE ?");
    values.push(wildcard);
  }

  whereClauses.push("si.suppItemStatus != 'deleted'");
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT si.*,i.itemName,i.itemUnit,c.categoryName,c.categoryType FROM SupplierItems si
  LEFT JOIN Items i ON i.itemId = si.itemId
  LEFT JOIN Categories c ON c.categoryId = i.categoryId ${whereSQL}`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};

export async function handleDeleteSupplierItems(data: SupplierItem[]) {
  const deletedData: Partial<SupplierItem>[] = data.map((item) => ({
    suppItemId: item.suppItemId,
    suppItemStatus: "deleted",
  }));

  try {
    const result = await updateSupplierItemsByFields({
      keyFields: ["suppItemId"],
      data: deletedData,
    });
    return result;
  } catch (e) {
    throw e;
  }
}

export const updateSupplierItemsByFields = async ({
  data,
  keyFields,
  connection,
}: {
  keyFields: (keyof SupplierItem)[];
  data: Partial<SupplierItem>[];
  connection?: PoolConnection;
}) => {
  if (data.length === 0) {
    throw new Error("No data provided for update");
  }
  if (keyFields.length === 0) {
    throw new Error("No key fields provided for WHERE clause");
  }

  const pool = connection ? connection : await getDBConnection();

  // Get the update fields (excluding key fields)
  const updateFields = Object.keys(data[0]).filter(
    (field) => !keyFields.includes(field as keyof SupplierItem)
  );

  if (updateFields.length === 0) {
    throw new Error("No fields to update");
  }

  // Build SET clauses
  const setClauses: string[] = [];
  const params: any[] = [];

  for (const field of updateFields) {
    // Build CASE statement for each field
    const caseParts: string[] = [];

    for (const row of data) {
      const whenCondition = keyFields.map((k) => `${k} = ?`).join(" AND ");
      caseParts.push(`WHEN ${whenCondition} THEN ?`);

      // Add key field values for WHEN condition
      keyFields.forEach((k) => params.push(row[k]));
      // Add the update value for THEN
      params.push(row[field as keyof SupplierItem]);
    }

    // Complete CASE statement for this field
    const caseStatement = `${field} = (CASE ${caseParts.join(
      " "
    )} ELSE ${field} END)`;
    setClauses.push(caseStatement);
  }

  // Build WHERE clause
  const uniqueKeyCombinations = data.map((row) => keyFields.map((k) => row[k]));

  const whereSql =
    keyFields.length > 1
      ? `(${keyFields.join(", ")}) IN (${uniqueKeyCombinations
          .map(() => `(${keyFields.map(() => "?").join(",")})`)
          .join(",")})`
      : `${keyFields[0]} IN (${uniqueKeyCombinations
          .map(() => "?")
          .join(",")})`;

  // Add WHERE params
  uniqueKeyCombinations.forEach((vals) => params.push(...vals));

  // Build final SQL
  const sql = `UPDATE SupplierItems SET ${setClauses.join(
    ", "
  )} WHERE ${whereSql}`;

  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (error) {
    console.error("Update failed:", error);
    throw error;
  }
};

export const insertSupplierItemPrices = async ({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSupplierItemPriceDto[];
}) => {
  if (!data || data.length === 0) {
    throw new Error("No data provided for bulk insert");
  }
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SupplierItemPrices(sipAmount,suppItemId,sipCreatedBy) 
  VALUES ${data.map(() => "(?,?,?)")}`;
  const values = data.flatMap((item) => [
    item.sipAmount,
    item.suppItemId,
    item.sipCreatedBy,
  ]);
  const [results] = await pool.execute(sql, values);
  return results;
};

export const selectSupplierItem = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<SupplierItem>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM SupplierItems WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as SupplierItem[];
};

export const selectSupplierItemPrice = async ({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<SupplierItemPrices>;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM SupplierItemPrices WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyfields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  sql += ` ORDER BY sipCreatedAt DESC`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as SupplierItemPrices[];
};
