import { updateRequestItem } from "@/models/requestModel";
import { Request, RequestItems } from "@/types/request";
import { PoolConnection } from "mysql2/promise";

export async function updateRequestItems({
  connection,
  updates,
  keyFields = ["invItem"],
}: //   fieldModes = {}, // default primary key
{
  connection?: PoolConnection;
  updates: Partial<RequestItems>[];
  keyFields?: (keyof RequestItems)[];
  //   fieldModes?: Partial<Record<keyof RequestItems, any>>;
}) {
  try {
    await updateRequestItem({ connection, updates, keyFields });
  } catch (e) {
    throw e;
  }
}
