import { selectSupplier } from "@/models/supplierModels";

export async function getSupplierBySearch(search: string) {
  try {
    const data = await selectSupplier({ search });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findSupplierById(id: number) {
  try {
    const data = await selectSupplier({ keyFields: { suppId: id } });
    return data;
  } catch (e) {
    throw e;
  }
}
