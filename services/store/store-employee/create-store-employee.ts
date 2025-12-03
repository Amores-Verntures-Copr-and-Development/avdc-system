import { CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { insertStoreEmployees } from "@/models/storeModels";
import { PoolConnection } from "mysql2/promise";

export async function createStoreEmployees({
  data,
  connection,
}: {
  data?: CreateStoreEmployeeDto[];
  connection?: PoolConnection;
}) {
  try {
    const result = await insertStoreEmployees({ connection, data });
    return result;
  } catch (e) {
    throw e;
  }
}
