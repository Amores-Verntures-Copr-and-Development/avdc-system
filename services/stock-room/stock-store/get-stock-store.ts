import {
  selectStockStoresBySSKeyfields,
  selectStockStoresByStockRoomKeyfields,
} from "@/models/stockRoomModels";
import { StockRoom, StockStores } from "@/types/stockRoom";

export async function findStockStoresBySSKeyFields({
  keyFields = {},
}: {
  keyFields?: Partial<StockStores>;
}) {
  try {
    const data = await selectStockStoresBySSKeyfields({ keyFields });
    return data;
  } catch (e) {}
}

export async function findStockStoresByStockRoomKeyFields({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) {
  try {
    const data = await selectStockStoresByStockRoomKeyfields({ keyFields });
    return data;
  } catch (e) {}
}
