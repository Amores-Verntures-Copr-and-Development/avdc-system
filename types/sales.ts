export enum SalesPaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum SalesItemStatus {
  ACTIVE = "active",
  VOIDED = "voided",
  RETURNED = "returned", // returned to inventory
  REFUNDED_NO_RETURN = "refunded_no_return",
  HOLD = "hold",
}
export enum SalesStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
  VOIDED = "voided",
}

export enum SalesItemDiscStatus {
  APPLIED = "applied",
  REMOVED = "removed",
}

export type SalesSource = "pos" | "order";

export interface Sales {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: number;
  salesTotalPaid: number;
  salesSubTotal: number;
  salesStatus: SalesStatus;
  salesRemarks: string;
  salesSource: SalesSource;
  salesCreatedAt: string;
  salesUpdatedAt: string;
  salesDeletedAt: string;
  salesCreatedBy: number;
  customerId: number | null;
  storeId: number;
  saleItems?: SaleItems[];
  salePayments?: SalePayments[];
}

export interface SaleItems {
  salesItemId: number;
  salesId: number;
  salesItemQuantity: number;
  salesItemSubtotal: number;
  salesItemTotal: number;
  salesItemPrice: number;
  salesItemStatus: SalesItemStatus;
  salesItemRefundedBy: number;
  salesItemRefundedAt: string;
  prodVarId: number;
}

export interface Transations {
  transactionId: number;
  transactionRef: "sale" | "refund";
  transationAmount: number;
  transactionType: "in" | "out";
  transactionCreatedAt: "";
  storeId: number;
}

export interface SalePayments {
  salesPaymentId: number;
  salesPaymentAmount: number;
  salesPaymentStatus: SalesPaymentStatus;
  salesId: number;
  payMetId: number;
  paymentReference: string;
  paymentDate: number;
}

export interface SalesItemDiscounts {
  salesItemDiscId: number;
  salesItemId: number;
  discountId: number;
  discountAmount: number;
  salesItemDiscCreatedAt: string;
  salesItemDiscCreatedBy: number;
  salesItemDiscStatus: SalesItemDiscStatus;
}

export interface SalesItemDiscountV2 {
  discountAmount: number;
}

export interface SaleItemV2 {
  prodVarName: string;
  salesItemId: number;
  saleItemName: string;
  salesItemPrice: number;
  salesItemTotal: number;
  salesItemQuantity: number;
  salesItemSubtotal: number;
  salesItemDiscounts: SalesItemDiscountV2[] | null;
}

export interface PaymentMethodV2 {
  payMetId: number;
  payMetName: string;
  salesPaymentId: number;
  paymentReference: string;
  salesPaymentAmount: number;
}

export interface SalesDiscountV2 {
  discountName: string;
  discountAmount: number;
}

export interface SalesV2 {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: string;
  salesSubTotal: string;
  salesTotalPaid: string;
  salesRemarks: string;
  salesStatus: string;
  salesCreatedAt: string;
  salesUpdatedAt: string;
  salesDeletedAt: string | null;
  salesCreatedBy: number;
  customerId: number | null;
  storeId: number;
  storeName: string;
  salesCreatedByName: string;
  customerName: string | null;
  totalItem: number;
  saleItems: SaleItemV2[];
  paymentMethods: PaymentMethodV2[];
  salesDiscounts: SalesDiscountV2[] | null;
  salesRefunds: unknown[] | null;
  salesPaymentRefunds: unknown[] | null;
}

export type SalesResponseV2 = SalesV2[];

export interface SalesByProductVariant {
  prodVarId: number;
  prodVarName: string;
  prodId: number;
  prodName: string;
  totalQtySold: number;
  totalSales: number;
  totalTransactions: number;
}

// One row per sale that included a given product variant - powers the
// "which transactions is this variant's total made up of" drill-down modal.
export interface SalesTransactionByProductVariant {
  salesId: number;
  salesNo: string;
  salesCreatedAt: string;
  salesStatus: SalesStatus;
  customerId: number | null;
  customerName: string | null;
  storeName: string | null;
  quantity: number;
  salesItemPrice: number;
  subtotal: number;
  paymentMethods:
    | { payMetName: string; salesPaymentAmount: number }[]
    | null;
}
