import { updateSupplierItemsByFields } from "@/models/supplierModels";
import { SupplierItem } from "@/types/supplier";

export async function handleDeleteSupplierItems(data: SupplierItem[]) {
  const deletedData: Partial<SupplierItem>[] = data.map((item) => ({
    suppItemId: item.suppItemId,
    suppItemStatus: "deleted",
  }));
  try {
    const result = await updateSupplierItemsByFields({
      keyFields: ["suppItemId"],
      data: deletedData,
    });
    return result;
  } catch (e) {
    throw e;
  }
}
