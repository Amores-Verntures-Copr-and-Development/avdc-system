import { selectCategoriesById } from "@/models/categoryModels";

export async function getCategoriesById({
  stockRoomId,
  storeId,
}: {
  stockRoomId?: number;
  storeId?: number;
}) {
  try {
    const data = selectCategoriesById({ stockRoomId, storeId });
    return data;
  } catch (e) {
    throw e;
  }
}
