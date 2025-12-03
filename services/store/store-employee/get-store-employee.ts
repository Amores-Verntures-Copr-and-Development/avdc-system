import { selectStoreEmployee } from "@/models/storeModels";
import { EmployeeInterface } from "@/types/employees";
import { PoolConnection } from "mysql2/promise";

export async function getStoreEmployee({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<EmployeeInterface>;
}) {
  try {
    const data = await selectStoreEmployee({connection,keyFields});
    return data;
  } catch (e) {
    throw e;
  }
}
