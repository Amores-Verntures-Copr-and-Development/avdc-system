import {
  selectStoreEmployee,
  selectStoreEmployeeDetails,
} from "@/models/storeModels";
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
    const data = await selectStoreEmployee({ connection, keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getStoreEmployeeDetails({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<EmployeeInterface>;
}) {
  try {
    const data = await selectStoreEmployeeDetails({ connection, keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}
