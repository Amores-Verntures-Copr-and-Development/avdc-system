import { selectStoresByPoId } from "@/models/storeModels";

export async function findStoreByPOID(poId: number) {
  try {
    const data = await selectStoresByPoId(poId);
    return data;
  } catch (e) {
    throw e;
  }
}
