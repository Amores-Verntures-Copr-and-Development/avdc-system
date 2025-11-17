import {
  selectStoresByEmpKeyFields,
  selectStoresByPoId,
} from "@/models/storeModels";
import { EmployeeInterface } from "@/types/employees";

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
