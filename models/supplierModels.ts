import { CreateSupplierDto, CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { getDBConnection } from "@/lib/db";
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
}: {
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT * FROM Suppliers`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql);
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
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO SupplierItems(suppId,itemId,suppItemPrice,suppItemCreatedBy) VALUES(?,?,?,?)`;
  const [results] = await pool.execute(sql, [
    // data.suppId,
    // data.itemId,
    // data.suppItemPrice,
    // data.suppItemCreatedBy,
  ]);
  return results;
};

export const selectSupplierItems = async ({ suppId }: { suppId?: number }) => {
  const pool = await getDBConnection();
  let whereClauses: string[] = [];
  let values: any[] = [];
  console.log("Supp Id: ", suppId);
  if (suppId) {
    whereClauses.push("si.suppId = ?");
    values.push(suppId);
  }
  const whereSQL =
    whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";
  const sql = `SELECT si.*,i.itemName,i.itemUnit,c.categoryName,c.categoryType FROM SupplierItems si
  LEFT JOIN Items i ON i.itemId = si.itemId
  LEFT JOIN Categories c ON c.categoryId = i.categoryId ${whereSQL}`;
  console.log("SQL: ", sql);
  const [rows] = await pool.execute(sql, values);
  console.log("Rows: ", rows);
  return rows;
};
