import { selectDailyStoreSales } from "@/models/saleModel";

export async function getDailyStoreSales() {
  try {
    const data = await selectDailyStoreSales();
    return data;
  } catch (e) {
    throw e;
  }
}


