import {
  CreateSupplierItemDto,
  CreateSupplierItemPriceDto,
} from "@/dtos/supplier.dto";
import {
  insertSupplierItemPrices,
  insertSupplierItems,
} from "@/models/supplierModels";
import { PoolConnection } from "mysql2/promise";

export async function createSupplierItemPrices({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateSupplierItemPriceDto[];
}) {
  try {
    const result = await insertSupplierItemPrices({ data, connection });
    return result;
  } catch (e) {
    throw e;
  }
}
