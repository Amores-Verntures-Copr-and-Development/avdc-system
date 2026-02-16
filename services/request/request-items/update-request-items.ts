import { updateRequestItem } from "@/models/requestModel";
import { Request, RequestItems } from "@/types/request";
import { PoolConnection } from "mysql2/promise";

export async function updateRequestItems({
  connection,
  updates,
  keyFields = ["invItem"],
}: {
  connection?: PoolConnection;
  updates: Partial<RequestItems>[];
  keyFields?: (keyof RequestItems)[];
}) {
  try {
    await updateRequestItem({ connection, updates, keyFields });
  } catch (e) {
    throw e;
  }
}
