import { StoreEmployee, StoreInterface } from "@/types/stores";

export type CreateStoreDto = Pick<
  StoreInterface,
  "storeName" | "storeLocation" | "storeDescription" | "storeCreatedBy"
>;

export type CreateStoreEmployeeDto = Pick<
  StoreEmployee,
  "storeId" | "empId" | "storeEmpCreatedBy"
>;
