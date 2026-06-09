import { CreateISRStoreDto } from "@/dtos/isr.dto";
import { insertISRStore } from "@/models/isrModels";
import { PoolConnection } from "mysql2/promise";

export async function createISRStore({
  data,
  connection,
}: {
  data: CreateISRStoreDto;
  connection?: PoolConnection;
}) {
  return await insertISRStore({ data, connection });
}
