import { CreateRequestItemDto } from "@/dtos/request.dto";
import { insertRequestItemsBulk } from "@/models/requestModel";
import { PoolConnection } from "mysql2/promise";

export async function createRequestItem({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateRequestItemDto[];
}) {
  try {
    await insertRequestItemsBulk({ connection: connection, data: data });
  } catch (e) {
    throw e;
  }
}
