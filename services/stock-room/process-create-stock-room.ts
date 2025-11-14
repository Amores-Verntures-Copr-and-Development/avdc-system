import { CreateStockRoom } from "@/dtos/stockRoom.dto";
import { getDBConnection } from "@/lib/db";
import { createStockRoom } from "./create-stock-room";
import { createInvetory } from "../inventory/create-inventory";
import { CreateInventoryDto } from "@/dtos/inventory.dto";

export async function processCreateStockRoom(data: CreateStockRoom) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = await createStockRoom({ connection, data });
    const inventoryData: CreateInventoryDto = {
      inventoryDescription: `${data.stockRoomName} Inventory`,
      inventoryReference: "stock-room",
      inventotyReferenceId: id,
      inventoryCreatedBy: data.stockRoomCreatedBy,
    };
    await createInvetory({ connection, data: inventoryData });
    await connection.commit();
    return id;
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
