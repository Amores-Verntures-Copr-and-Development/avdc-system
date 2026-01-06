export type SalesPaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "refunded"
  | "cancelled";
export type SalesStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "refunded"
  | "cancelled";
export interface Sales {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: number;
  salesTotalPaid: number;
  salesSubTotal: number;
  salesStatus: SalesStatus;
  salesCreatedAt: string;
  salesUpdatedAt: string;
  salesDeletedAt: string;
  salesCreatedBy: number;
  customerId: number | null;
  storeId: number;
}

export interface SaleItems {
  salesItemId: number;
  salesId: number;
  inventoryItemId: number | null;
  salesItemQuantity: number;
  salesItemSubtotal: number;
  salesItemPrice: number;
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
