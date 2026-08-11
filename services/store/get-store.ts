import {
  selectStores,
  selectStoreSales,
  selectStoresByEmpKeyFields,
  selectStoresByInventoryKeyFields,
  selectStoresByPoId,
} from "@/models/storeModels";
import { EmployeeInterface } from "@/types/employees";
import { InventoryInterface } from "@/types/inventory";
import { StoreInterface } from "@/types/stores";

export async function findStoreByPOID(poId: number) {
  try {
    const data = await selectStoresByPoId(poId);
    return data;
  } catch (e) {
    throw e;
  }
}

export async function getStoreBy({
  search,
  limit,
  skip,
  keyfields = {},
}: {
  search?: string;
  limit?: number;
  skip?: number;
  keyfields?: Partial<StoreInterface>;
}) {
  return await selectStores({});
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
    console.log({ e });
    throw e;
  }
}

export async function getStoreSales({
  from,
  to,
  notZeroSales,
  storeIds,
}: {
  from?: string;
  to?: string;
  notZeroSales?: boolean;
  storeIds?: number[];
}) {
  return await selectStoreSales({ from, to, notZeroSales, storeIds });
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
