import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { getDBConnection } from "@/lib/db";
import { Supplier } from "@/types/supplier";
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
  return rows;
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

export const selectSupplierItems = async ({ suppId }: { suppId?: number }) => {
  const pool = await getDBConnection();
  let whereClauses: string[] = [];
  let values: any[] = [];
  if (suppId) {
    whereClauses.push("si.suppId = ?");
    values.push(suppId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT si.*,i.itemName,i.itemUnit,c.categoryName,c.categoryType FROM SupplierItems si
  LEFT JOIN Items i ON i.itemId = si.itemId
  LEFT JOIN Categories c ON c.categoryId = i.categoryId ${whereSQL}`;
  const [rows] = await pool.execute(sql, values);
  return rows;
};
