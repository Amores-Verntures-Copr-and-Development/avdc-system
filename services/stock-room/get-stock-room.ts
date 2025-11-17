import {
  selectStockRoom,
  selectStockRoomSPFields,
} from "@/models/stockRoomModels";
import { StockPurchasers, StockRoom } from "@/types/stockRoom";

export async function getStockRoom({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) {
  try {
    const data = await selectStockRoom({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getStockRoomInventoryItems({
  keyFields = {},
}: {
  keyFields?: Partial<StockRoom>;
}) {}

export async function findStockRoomBySPFields({
  keyFields = {},
}: {
  keyFields?: Partial<StockPurchasers>;
}) {
  try {
    const data = await selectStockRoomSPFields({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

// export async function findStockRoomBySSFields({
//   keyFields = {},
// }: {
//   keyFields?: Partial<StockPurchasers>;
// }) {
//   try {
//     const data = await selectStockRoomSSFields({ keyFields });
//     return data;
//   } catch (e) {
//     throw e;
//   }
// }
