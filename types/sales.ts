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

export interface Sales {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: number;
  salesTotalPaid: number;
  salesSubTotal: number;
  salesStatus: SalesStatus;
  salesRemarks: string;
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
  prodVarId: number;
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

export interface SaleRefund {
  saleRefundId: number;
  salespaymentId: number;
  saleRefundAmount: number;
  saleRefunddBy: number;
  saleRefundCreatedAt: string;
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
