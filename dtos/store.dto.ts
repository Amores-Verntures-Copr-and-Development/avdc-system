import { StoreEmployee, StoreInterface } from "@/types/stores";

export type CreateStoreDto = Pick<
  StoreInterface,
  "storeName" | "storeLocation" | "storeDescription" | "storeCreatedBy"
> &
  Partial<Pick<StoreInterface, "companyId">>;

export type CreateStoreEmployeeDto = Pick<
  StoreEmployee,
  "storeId" | "empId" | "storeEmpCreatedBy"
>;

export type UpdateStoreFeaturesDto = Partial<
  Pick<
    StoreInterface,
    | "storeKioskEnabled"
    | "storeOrderEnabled"
    | "storeKioskBannerImage"
    | "storeSalesApprovalEnabled"
    | "storeInstallmentEnabled"
  >
>;
