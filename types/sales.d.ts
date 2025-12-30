export interface Sales {
  salesId: number;
  salesNo: string;
  salesInvoice: string;
  salesTotalAmount: number;
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
  saleItemQuantity: number;
  saleItemPrice: number;
  saleItemSubtotal: number;
}

export interface SalePayments {
  salesPaymentId: number;
  salesPaymentAmount: number;
  salesPaymentStatus: string;
  salesId: number;
  payMetId: number;
  paymentReference: string;
  paymentDate: number;
}
