import {
  selectStoresByEmpKeyFields,
  selectStoresByInventoryKeyFields,
  selectStoresByPoId,
} from "@/models/storeModels";
import { EmployeeInterface } from "@/types/employees";
import { InventoryInterface } from "@/types/inventory";

export async function findStoreByPOID(poId: number) {
  try {
    const data = await selectStoresByPoId(poId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findStoreByEmpFields({
  keyFields = {},
}: {
  keyFields?: Partial<EmployeeInterface>;
}) {
  try {
    const data = await selectStoresByEmpKeyFields({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}

export async function findStoreByInventoryFields({
  keyFields = {},
}: {
  keyFields?: Partial<InventoryInterface>;
}) {
  try {
    const data = await selectStoresByInventoryKeyFields({ keyFields });
    return data;
  } catch (e) {
    throw e;
  }
}
