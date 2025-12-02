import { selectSupplierItem } from "@/models/supplierModels";
import { SupplierItem } from "@/types/supplier";
import { PoolConnection } from "mysql2/promise";

export async function getSupplierItem({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<SupplierItem>;
}) {
  try {
    const data = await selectSupplierItem({ connection, keyfields });
    return data;
  } catch (e) {
    throw e;
  }
}
