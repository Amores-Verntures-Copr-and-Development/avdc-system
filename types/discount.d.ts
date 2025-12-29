export type DiscountType = "fixed" | "percent";

export interface Discounts {
  discountId: number;
  discountName: string;
  discountType: DiscountType;
  discountValue: number;
  discountCreatedAt: string;
  discountUpdatedAt: number;
  discountDeletedAt: number;
  discountCreatedBy: number;
  storeId: number;
}
