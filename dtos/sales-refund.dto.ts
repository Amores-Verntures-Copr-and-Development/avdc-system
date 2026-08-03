import {
  SalesItemRefund,
  SalesPaymentRefund,
  SalesRefund,
} from "@/types/sales-refund";

export type CreateSalesRefundDto = Pick<
  SalesRefund,
  | "salesId"
  | "salesRefAmount"
  | "storeId"
  | "salesRefCreatedAt"
  | "salesRefCreatedBy"
  | "salesRefReason"
> & {
  salesItemRefunds?: CreateSaleItemRefundDto[];
  salesPaymentRefunds?: CreateSalePaymentRefundDto[];
};

export type CreateSaleItemRefundDto = Pick<
  SalesItemRefund,
  "salesItemId" | "salesRefItemPrice" | "salesRefItemQty" | "salesRefId"
> &
  Partial<Pick<SalesItemRefund, "restockQty">>;

export type CreateSalePaymentRefundDto = Pick<
  SalesPaymentRefund,
  "payMetId" | "salesPayRefAmount" | "salesPayRefReference" | "salesRefId"
>;
