import { CreateRequestDto } from "@/dtos/request.dto";
import { insertRequest } from "@/models/requestModel";
import { PoolConnection } from "mysql2/promise";

export async function createRequest({
  connection,
  data,
}: {
  connection?: PoolConnection;
  data: CreateRequestDto;
}) {
  try {
    const requestId = await insertRequest({ connection, data });
    return requestId;
  } catch (e) {
    throw e;
  }
}
