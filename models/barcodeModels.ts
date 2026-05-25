import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { getDBConnection } from "@/lib/db";
import { Barcodes } from "@/types/barcode";

import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertBarcode = async ({
  data,
  connection,
}: {
  data: CreateBarcodeDto[];
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Barcodes(prodVarId,barcode,createdByinventoryItemId) VALUES ${data.map(() => "(?,?,?,?)")} `;
  const values = data.flatMap((item) => [
    item.prodVarId,
    item.barcode,
    item.createdBy,
    item.inventoryItemId,
  ]);
  const [result] = await pool.execute<ResultSetHeader>(sql, values);
  return result.insertId;
};

export const selectBarcodes = async ({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Barcodes>;
  search?: string;
}) => {
  const pool = connection ? connection : await getDBConnection();
  let sql = `SELECT * FROM Barcodes WHERE 1=1`;
  const params: any[] = [];
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND ${key} IS NULL`;
    } else {
      sql += ` AND ${key} = ?`;
      params.push(value);
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Barcodes[];
};
