import { CreateCustomerCartDto } from "@/dtos/customerCart.dto";
import { getDBConnection } from "@/lib/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const insertCustomerCartItem = async ({
  data,
  connection,
}: {
  data: CreateCustomerCartDto;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  // Adding an item already in the cart merges quantities instead of erroring on the unique key.
  const sql = `
    INSERT INTO CustomerCart (customerId, prodVarId, cartQuantity)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE cartQuantity = cartQuantity + VALUES(cartQuantity)
  `;
  await pool.execute<ResultSetHeader>(sql, [
    data.customerId,
    data.prodVarId,
    data.cartQuantity,
  ]);
};

export const selectCustomerCart = async ({
  customerId,
  connection,
}: {
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    SELECT
      cc.cartId,
      cc.customerId,
      cc.prodVarId,
      cc.cartQuantity,
      cc.cartCreatedAt,
      cc.cartUpdatedAt,
      pv.prodVarName,
      pv.prodVarPrice,
      pv.prodVarUnit,
      pv.prodVarImage,
      p.prodName
    FROM CustomerCart cc
    LEFT JOIN ProductVariants pv ON pv.prodVarId = cc.prodVarId
    LEFT JOIN Products p ON p.prodId = pv.prodId
    WHERE cc.customerId = ?
    ORDER BY cc.cartCreatedAt DESC
  `;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [customerId]);
  return rows;
};

export const selectCustomerCartItemById = async ({
  cartId,
  customerId,
  connection,
}: {
  cartId: number;
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `SELECT * FROM CustomerCart WHERE cartId = ? AND customerId = ?`;
  const [rows] = await pool.execute<RowDataPacket[]>(sql, [
    cartId,
    customerId,
  ]);
  return rows[0] ?? null;
};

export const updateCustomerCartItemQuantity = async ({
  cartId,
  customerId,
  cartQuantity,
  connection,
}: {
  cartId: number;
  customerId: number;
  cartQuantity: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `
    UPDATE CustomerCart
    SET cartQuantity = ?
    WHERE cartId = ? AND customerId = ?
  `;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    cartQuantity,
    cartId,
    customerId,
  ]);
  return result;
};

export const deleteCustomerCartItem = async ({
  cartId,
  customerId,
  connection,
}: {
  cartId: number;
  customerId: number;
  connection?: PoolConnection;
}) => {
  const pool = connection ? connection : await getDBConnection();
  const sql = `DELETE FROM CustomerCart WHERE cartId = ? AND customerId = ?`;
  const [result] = await pool.execute<ResultSetHeader>(sql, [
    cartId,
    customerId,
  ]);
  return result;
};
