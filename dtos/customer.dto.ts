import { Customer, CustomerAccount } from "@/types/customer";

export type CreateCustomerDto = Pick<
  Customer,
  | "customerName"
  | "customerPhone"
  | "customerEmail"
  | "storeId"
  | "customerCreatedBy"
  | "customerType"
  | "customerAddress"
  | "customerSource"
>;

export interface DisplayCustomerDto extends Customer {
  storeName: string;
  storeId: number;
  totalSpent: number;
  firstVisit: string;
  lastVisit: string;
}

export type CreateCustomerAccountDto = Pick<
  CustomerAccount,
  "email" | "password" | "customerId" | "company"
>;

export interface RegisterCustomerAccountDto
  extends CreateCustomerDto, CreateCustomerAccountDto {}
