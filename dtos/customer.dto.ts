import {
  CusEmailVerification,
  Customer,
  CustomerAccount,
} from "@/types/customer";

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
  | "email"
  | "password"
  | "customerId"
  | "company"
  | "firstName"
  | "middleName"
  | "lastName"
>;

export interface RegisterCustomerAccountDto
  extends CreateCustomerDto, CreateCustomerAccountDto {}

export type CreateCusEmailVerificationDto = Pick<
  CusEmailVerification,
  "cusAccId" | "codeHash" | "expiresAt"
>;

export type VerifyCustomerEmailDto = {
  email: string;
  code: string;
};

export type ResendCustomerVerificationDto = {
  email: string;
};

export type CustomerLoginDto = {
  email: string;
  password: string;
  storeId: number;
};
