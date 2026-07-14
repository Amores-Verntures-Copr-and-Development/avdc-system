export interface Customer {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPhone: string;
  customerType: string;
  customerSource?: CustomerSource;
  customerCreatedAt: string;
  customerUpdatedAt: string;
  customerDeletedAt: string;
  customerCreatedBy?: number | null;
  storeId: number;
}

export type CustomerSource = "online" | "system";

export type CustomerAccountStatus = "active" | "inactive" | "deleted";

export interface CustomerAccount {
  cusAccId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  company: string | null;
  email: string;
  password: string;

  emailVerified: boolean;
  emailVerifiedAt: string | null;

  phoneVerified: boolean;
  phoneVerifiedAt: string | null;

  cusAccStatus: CustomerAccountStatus;

  cusAccCreatedAt: string;
  cusAccUpdatedAt: string;
  cusAccDeletedAt: string | null;

  customerId: number;
}

export interface CusEmailVerification {
  cusEmailVerId: number;
  cusAccId: number;

  codeHash: string;

  expiresAt: string;
  verifiedAt: string | null;

  attempts: number;
  isUsed: boolean;

  createdAt: string;
  updatedAt: string;
}
