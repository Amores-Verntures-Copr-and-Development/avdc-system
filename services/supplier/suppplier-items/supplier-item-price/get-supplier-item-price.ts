import { selectSupplierItemPrice } from "@/models/supplierModels";
import { SupplierItemPrices } from "@/types/supplier";
import { PoolConnection } from "mysql2/promise";

export async function getSupplierItemPrice({
  connection,
  keyfields = {},
}: {
  connection?: PoolConnection;
  keyfields: Partial<SupplierItemPrices>;
}) {
  try {
    const data = await selectSupplierItemPrice({ connection, keyfields });
    return data;
  } catch (e) {
    throw e;
  }
}
