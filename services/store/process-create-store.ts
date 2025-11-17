import { CreateStoreDto } from "@/dtos/store.dto";
import { getDBConnection } from "@/lib/db";
import { createStore } from "./create-store";
import { CreateInventoryDto } from "@/dtos/inventory.dto";
import { createInvetory } from "../inventory/create-inventory";

export async function processCreateStore(data: CreateStoreDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const storeId = await createStore({ connection, data });
    const inventoryData: CreateInventoryDto = {
      inventoryDescription: `${data.storeName} Inventory`,
      inventoryReference: "store",
      inventoryReferenceId: Number(storeId),
      inventoryCreatedBy: data.storeCreatedBy,
    };
    await createInvetory({ data: inventoryData, connection });
    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
