import { CreateISRRequestHandlerDto } from "@/dtos/isr.dto";
import {
  insertISRRequestHandler,
  selectISRRequestHandler,
} from "@/models/isrModels";
import { ISRRequestHandlers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function createISRRequestHandler({
  data,
  connection,
}: {
  data: CreateISRRequestHandlerDto;
  connection?: PoolConnection;
}) {
  return await insertISRRequestHandler({ data, connection });
}
