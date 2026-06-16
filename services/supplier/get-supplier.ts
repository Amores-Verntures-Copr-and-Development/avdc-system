import {
  selectSupplier,
  selectSupplierByInventoryFields,
} from "@/models/supplierModels";
import { PoolConnection } from "mysql2/promise";

export async function getSupplierBySearch(search: string) {
  try {
    const data = await selectSupplier({ search });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findSupplierById(id: number) {
  try {
    const data = await selectSupplier({ keyFields: { suppId: id } });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getSupplierByInventoryFields({
  inventoryId,
  connection,
}: {
  inventoryId: number;
  connection?: PoolConnection;
}) {
  return await selectSupplierByInventoryFields({ inventoryId, connection });
}
