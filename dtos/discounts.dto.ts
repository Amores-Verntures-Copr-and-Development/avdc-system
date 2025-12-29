import { Discounts } from "@/types/discount";

export type CreateDiscountDto = Pick<
  Discounts,
  | "discountName"
  | "discountValue"
  | "discountCreatedBy"
  | "storeId"
  | "discountType"
>;
