import { CreateISRRequestHandlerDto } from "@/dtos/isr.dto";
import {
  insertISRRequestHandler,
  selectCountISRRequestHandler,
  selectISRRequestHandler,
} from "@/models/isrModels";
import { ISRRequestHandlers } from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

export async function getISRRequestHandler({
  connection,
  keyFields = {},
  code,
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof ISRRequestHandlers, any>>;
  code?: string;
}) {
  const data = await selectISRRequestHandler({
    code,
    keyFields,
    connection,
  });

  const count = await selectCountISRRequestHandler({
    code,
    keyFields,
    connection,
  });
  return {
    data: data,
    count: count,
  };
}
