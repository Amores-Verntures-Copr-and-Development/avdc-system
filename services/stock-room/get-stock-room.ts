import { selectStockRoom } from "@/models/stockRoomModels";
import { StockRoom } from "@/types/stockRoom";

export async function getStockRoom({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) {
  try {
    const data = await selectStockRoom({ keyFields });
    return data;
  } catch (e) {}
}

export async function getStockRoomInventoryItems({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) {}
