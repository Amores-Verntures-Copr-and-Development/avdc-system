import { CreateISRPurchaserDto } from "@/dtos/isr.dto";
import { insertISRPurchaser } from "@/models/isrModels";
import { PoolConnection } from "mysql2/promise";

export async function createISRPurchaser({
  data,
  connection,
}: {
  data: CreateISRPurchaserDto;
  connection?: PoolConnection;
}) {
  return await insertISRPurchaser({ data, connection });
}
