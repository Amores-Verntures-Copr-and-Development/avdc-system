import { PaymentMethods } from "@/types/payment-methods";

export type CreatePaymentMethodDto = Pick<
  PaymentMethods,
  | "payMetCreatedBy"
  | "payMetName"
  | "storeId"
  | "payMetHasRef"
  | "payMetDesc"
  | "payMetIsEmail"
>;
