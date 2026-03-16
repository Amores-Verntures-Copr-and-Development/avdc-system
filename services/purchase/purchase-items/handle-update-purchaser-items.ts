import { CreatePurchaseOrderItemDto } from "@/dtos/purchase.dto";
import { getDBConnection } from "@/lib/db";
import { Console } from "console";
import { createPurchaseOrderItem } from "./create-purchase-items";

export async function handleUpdatePurchaseItems(
  data: CreatePurchaseOrderItemDto[],
) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await createPurchaseOrderItem({ connection, data });
    //check if the itemId is existing
    //if existing increment the totalQuntity
    //if not insert

    await connection.commit();
  } catch (e) {
    await connection.rollback();
  } finally {
    connection.release();
  }
}
