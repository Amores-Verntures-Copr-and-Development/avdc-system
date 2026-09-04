import { Companies } from "@/types/company";

export type CreateCompanyDto = Pick<Companies, "companyName" | "companyCreatedBy"> &
  Partial<
    Pick<
      Companies,
      | "companyEmail"
      | "companyPhone"
      | "companyStatus"
      | "companyMaxStores"
      | "companyInstallmentEnabled"
    >
  >;

export type UpdateCompanyDto = Pick<Companies, "companyId"> &
  Partial<
    Pick<
      Companies,
      | "companyName"
      | "companyEmail"
      | "companyPhone"
      | "companyStatus"
      | "companyMaxStores"
      | "companyInstallmentEnabled"
    >
  >;

export interface DisplayCompanyDto extends Companies {
  userCount: number;
  storeCount: number;
}
