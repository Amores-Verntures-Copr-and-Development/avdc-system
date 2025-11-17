// export const selectStockPurchaserBySPKeyFields = async ({}: {}) => {
//   try {
//     const data = await selectStockPurchaser({});
//   } catch (e) {}
// };

import { CreateStockPurchaser } from "@/dtos/stockRoom.dto";
import { selectStockPurchaser } from "@/models/stockRoomModels";
import { selectPurchaserNotInStockPurchaser } from "@/models/userModels";
import { StockPurchasers } from "@/types/stockRoom";

export async function selectStockPurchaserBySPKeyFields({
  stockPurchaserFields,
}: {
  stockPurchaserFields: Partial<StockPurchasers>;
}) {
  try {
    const data = await selectStockPurchaser({
      stockPurchaserFields: stockPurchaserFields,
    });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findUsersNotInStockPurchaser() {
  try {
    const data = await selectPurchaserNotInStockPurchaser();
    return data;
  } catch (e) {
    throw e;
  }
}
