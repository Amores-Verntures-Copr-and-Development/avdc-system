import { CreateSupplierItemDto } from "@/dtos/supplier.dto";
import { getDBConnection } from "@/lib/db";
import { insertSupplierItems } from "@/models/supplierModels";
import { PoolConnection } from "mysql2/promise";

export async function createSupplierItems({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSupplierItemDto[];
}) {
  try {
    const result = await insertSupplierItems({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
