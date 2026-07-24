import { PaymentMethods } from "@/types/payment-methods";

export type CreatePaymentMethodDto = Pick<
  PaymentMethods,
  | "payMetCreatedBy"
  | "payMetName"
  | "storeId"
  | "payMetHasRef"
  | "payMetDesc"
  | "payMetIsEmail"
> &
  Partial<Pick<PaymentMethods, "payMetIsOnline" | "payMetIsCustomer">>;

export type UpdatePaymentMethodDto = Pick<PaymentMethods, "payMetId"> &
  Partial<
    Pick<
      PaymentMethods,
      | "payMetName"
      | "payMetDesc"
      | "payMetHasRef"
      | "payMetIsEmail"
      | "payMetIsOnline"
      | "payMetIsCustomer"
    >
  >;
