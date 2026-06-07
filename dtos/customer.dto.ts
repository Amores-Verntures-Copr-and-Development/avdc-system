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
  "customerId" | "customerPassword" | "customerVerified"
>;

export interface CreateCustomerOnline
  extends CreateCustomerDto, CreateCustomerAccountDto {}
