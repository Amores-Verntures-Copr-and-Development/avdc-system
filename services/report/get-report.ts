import { selectReport } from "@/models/reportModels";
import { Reports } from "@/types/report";
import { PoolConnection } from "mysql2/promise";

export async function getReport({
  keyFields = {},
  connection,
}: {
  keyFields: Partial<Reports>;
  connection?: PoolConnection;
}) {
  try {
    const data = await selectReport({ keyFields, connection });
    return data;
  } catch (e) {
    throw e;
  }
}
