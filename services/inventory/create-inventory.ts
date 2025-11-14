import { CreateInventoryDto } from "@/dtos/inventory.dto";
import { insertInventory } from "@/models/inventoryModels";
import { PoolConnection } from "mysql2/promise";

export async function createInvetory({
  data,
  connection,
}: {
  data: CreateInventoryDto;
  connection: PoolConnection;
}) {
  try {
    const id = await insertInventory({ data, connection });
    return id;
  } catch (e) {
    throw e;
  }
}
