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
  inventoryItemId: number;
  saleItemQuantity: number;
  saleItemPrice: number;
  saleItemSubtotal: number;
}

export interface SalePayments {
  salesPaymentId: number;
  salesPaymentMethod: string;
  salesPaymentAmount: number;
  salesPaymentStatus: string;
  salesId: number;
  paymentReference: string;
  paymentDate: number;
}
