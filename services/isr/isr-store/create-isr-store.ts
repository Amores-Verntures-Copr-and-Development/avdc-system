import { CreateISRStoreDto } from "@/dtos/isr.dto";
import { insertISRStore } from "@/models/isrModels";
import { PoolConnection } from "mysql2/promise";
import { getISRStores } from "./get-isr-store";
import { updateISRStoreByFields } from "./update-isr-store";

export async function createISRStore({
  data,
  connection,
}: {
  data: CreateISRStoreDto;
  connection?: PoolConnection;
}) {
  try {
    const isExisting = await getISRStores({
      connection,
      keyFields: {
        storeId: data.storeId,
        isrId: data.isrId,
        isrStoreDeletedAt: "NOTNULL",
      },
    });

    if (isExisting.data.length > 0) {
      updateISRStoreByFields({
        connection,
        updates: [
          {
            isrId: data.isrId,
            storeId: data.storeId,
            isrStoreDeletedAt: null,
          },
        ],
        keyFields: ["storeId", "isrId"],
      });
      return;
    }
    return await insertISRStore({ connection, data });
  } catch (e) {
    throw e;
  }
}
