import { CreateInventoryMovementDto } from "@/dtos/inventory.dto";
import { insertInventoryMovement } from "@/models/inventoryModels";
import { PoolConnection } from "mysql2/promise";

export async function createInventoryMovement({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateInventoryMovementDto[];
}) {
  try {
    await insertInventoryMovement({ connection, data });
  } catch (e) {
    throw e;
  }
}
