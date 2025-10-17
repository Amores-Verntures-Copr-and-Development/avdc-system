import { UpdateRequestDto } from "@/dtos/request.dto";
import { updateRequest } from "@/models/requestModel";
import { Request } from "@/types/request";
import { PoolConnection } from "mysql2/promise";

export async function updateRequests({
  connection,
  updates,
  keyFields = ["requestId"], // default primary key
}: {
  connection?: PoolConnection;
  updates: Partial<Request>[];
  keyFields?: (keyof Request)[]; // which fields define the WHERE condition
}) {
  try {
    await updateRequest({ connection, updates, keyFields });
  } catch (e) {
    throw e;
  }
}
