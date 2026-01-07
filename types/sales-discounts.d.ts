export type SalesDiscStatus = "applied" | "removed";

export interface SalesDiscounts {
  salesDiscountId: number;
  saleId: number;
  discountId: number;
  discountAmount: number;
  salesDiscStatus: SalesDiscStatus;
}
