import {
  CreateCustomerAddressDto,
  UpdateCustomerAddressDto,
} from "@/dtos/customerAddress.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

// keeps the composite (customerId, isDefault) invariant of "at most one
// default address per customer" true regardless of caller input
const ALLOWED_UPDATE_FIELDS = [
  "label",
  "phone",
  "isDefault",
  "street",
  "barangay",
  "city",
  "province",
] as const;

export const insertCustomerAddress = async ({
  data,
  connection,
}: {
  data: CreateCustomerAddressDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  if (data.isDefault) {
    await pool.execute(
      `UPDATE CustomerAddresses SET isDefault = 0 WHERE customerId = ?`,
      [data.customerId],
    );
  }

  const sql = `
    INSERT INTO CustomerAddresses (customerId, label, phone, isDefault, street, barangay, city, province)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    data.customerId,
    data.label,
    data.phone ?? null,
    data.isDefault ? 1 : 0,
    data.street,
    data.barangay,
    data.city,
    data.province,
  ]);

  return result.insertId;
};

export const selectCustomerAddresses = async ({
  customerId,
  connection,
}: {
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    SELECT * FROM CustomerAddresses
    WHERE customerId = ? AND addressDeletedAt IS NULL
    ORDER BY isDefault DESC, addressCreatedAt DESC
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [customerId]);
  return rows;
};

export const selectCustomerAddressById = async ({
  addressId,
  customerId,
  connection,
}: {
  addressId: number;
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    SELECT * FROM CustomerAddresses
    WHERE addressId = ? AND customerId = ? AND addressDeletedAt IS NULL
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [
    addressId,
    customerId,
  ]);

  return rows[0] ?? null;
};

export const updateCustomerAddress = async ({
  addressId,
  customerId,
  data,
  connection,
}: {
  addressId: number;
  customerId: number;
  data: UpdateCustomerAddressDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();

  if (data.isDefault) {
    await pool.execute(
      `UPDATE CustomerAddresses SET isDefault = 0 WHERE customerId = ?`,
      [customerId],
    );
  }

  const fields = Object.keys(data).filter((f) =>
    (ALLOWED_UPDATE_FIELDS as readonly string[]).includes(f),
  );

  if (fields.length === 0) return;

  const setClause = fields.map((f) => `${f} = ?`).join(", ");
  const values = fields.map((f) => {
    const value = (data as Record<string, unknown>)[f];
    return f === "isDefault" ? (value ? 1 : 0) : value;
  });

  const sql = `
    UPDATE CustomerAddresses
    SET ${setClause}
    WHERE addressId = ? AND customerId = ?
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    ...values,
    addressId,
    customerId,
  ]);

  return result;
};

export const deleteCustomerAddress = async ({
  addressId,
  customerId,
  connection,
}: {
  addressId: number;
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    UPDATE CustomerAddresses
    SET addressDeletedAt = CURRENT_TIMESTAMP
    WHERE addressId = ? AND customerId = ?
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    addressId,
    customerId,
  ]);

  return result;
};
