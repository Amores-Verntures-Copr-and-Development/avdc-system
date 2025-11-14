import { CreateStoreDto } from "@/dtos/store.dto";
import { insertStore } from "@/models/storeModels";
import { PoolConnection } from "mysql2/promise";

export async function createStore({
  connection,
  data,
}: {
  connection: PoolConnection;
  data: CreateStoreDto;
}) {
  try {
    const id = await insertStore({ connection, data });
    return id;
  } catch (e) {
    throw e;
  }
}
