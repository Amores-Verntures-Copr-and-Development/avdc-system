export type SalesPaymentStatus = "pending" | "completed" | "failed";

export interface Sales {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: number;
  salesTotalPaid: number;
  salesSubTotal: number;
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
