import { CreateInventoryItemDto } from "@/dtos/inventory.dto";
import { insertInventoryItemsBulk } from "@/models/inventoryModels";
import { PoolConnection } from "mysql2/promise";

export async function createInventoryItems({
  connection,
  data,
}: {
  data: CreateInventoryItemDto[];
  connection?: PoolConnection;
}) {
  try {
    const res = await insertInventoryItemsBulk({ connection, data });
    return res;
  } catch (e) {
    throw e;
  }
}
