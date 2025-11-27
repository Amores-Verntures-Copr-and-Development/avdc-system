import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import {
  CreateInventoryItemReportDto,
  CreateInventoryReportDto,
  CreateReportDto,
} from "@/dtos/report.dto";
import { getDBConnection } from "@/lib/db";
import { InventoryReport } from "@/types/inventory";
import { Reports } from "@/types/report";
import { Rows } from "lucide-react";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const selectReport = async ({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<Reports>;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const params: any[] = [];
  let sql = `SELECT r.* FROM Reports r
LEFT JOIN Inventories i ON i.inventoryId = r.inventoryId WHERE 1=1`;
  for (const [key, value] of Object.entries(keyFields)) {
    if (value === null) {
      sql += ` AND r.${key} IS NULL`;
    } else {
      sql += ` AND r.${key} = ?`;
      params.push(value);
    }
  }
  sql += ` ORDER BY r.reportCreatedAt DESC`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Reports[];
};

export const insertReport = async ({
  data,
  connection,
}: {
  data: CreateReportDto;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO Reports(inventoryId,reportTitle,reportType,invReportCreatedBy) VALUES(?,?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.inventoryId,
    data.reportTitle,
    data.reportType,
    data.invReportCreatedBy,
  ]);
  return results.insertId;
};

export const insertInventoryReport = async ({
  data,
  connection,
}: {
  data: CreateInventoryReportDto;
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO InventoryReports(invReportFrom,invReportTo,reportId) VALUES(?,?,?)`;
  const [results] = await pool.execute<ResultSetHeader>(sql, [
    data.invReportFrom,
    data.invReportTo,
    data.reportId,
  ]);
  return results.insertId;
};

export const insertInventoryReportItems = async ({
  data,
  connection,
}: {
  data: CreateInventoryItemReportDto[];
  connection: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `INSERT INTO InventoryReportItems(invRepItemTotalIn,invRepItemTotalOut,invRepCurrentStock,invReportId,itemId) 
  VALUES ${data.map(() => "(?, ?, ?, ?, ?)").join(", ")}`;

  const values = data.flatMap((item) => [
    item.invRepItemTotalIn,
    item.invRepItemTotalOut,
    item.invRepCurrentStock,
    item.invReportId,
    item.itemId,
  ]);

  const [results] = await pool.execute<ResultSetHeader>(sql, values);
  return results;
};

export const selectInventoryReports = async ({
  keyInvRepFields = {},
  keyReportFields = {},
}: {
  keyInvRepFields?: Partial<InventoryReport>;
  keyReportFields?: Partial<Reports>;
}) => {
  const pool = await getDBConnection();
  let sql = `SELECT 
    ir.*,
    r.*,
    (
        SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
                'invRepItemId', iri.invRepItemId,
                'invRepItemTotalIn', iri.invRepItemTotalIn,
                'invRepItemTotalOut', iri.invRepItemTotalOut,
                'invRepCurrentStock', iri.invRepCurrentStock,
                'invReportId', iri.invReportId,
                'itemId', iri.itemId,
                'itemName',i.itemName,
                'categoryName', c.categoryName
            )
        )
        FROM InventoryReportItems iri
        LEFT JOIN Items i ON i.itemId = iri.itemId
        LEFT JOIN Categories c ON c.categoryId = i.categoryId
        WHERE iri.invReportId = ir.reportId
    ) as items
FROM InventoryReports ir
LEFT JOIN Reports r ON r.reportId = ir.reportId
WHERE 1=1`;
  const params: any[] = [];
  if (keyInvRepFields) {
    for (const [key, value] of Object.entries(keyInvRepFields)) {
      if (value === null) {
        sql += ` AND ir.${key} IS NULL`;
      } else {
        sql += ` AND ir.${key} = ?`;
        params.push(value);
      }
    }
  }
  if (keyReportFields) {
    for (const [key, value] of Object.entries(keyReportFields)) {
      if (value === null) {
        sql += ` AND r.${key} IS NULL`;
      } else {
        sql += ` AND r.${key} = ?`;
        params.push(value);
      }
    }
  }
  const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
  return rows as Reports[];
};
