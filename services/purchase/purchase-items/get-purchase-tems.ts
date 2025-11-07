import { selectStoreItemsBySupplierAndPOId } from "@/models/purchaseOrderModel";

export async function findStoreItemsBySupplierAndPOIds({
  suppId,
  poId,
}: {
  poId: number;
  suppId: number;
}) {
  try {
    const data = await selectStoreItemsBySupplierAndPOId({ suppId, poId });
    return data;
  } catch (e) {
    throw e;
  }
}
