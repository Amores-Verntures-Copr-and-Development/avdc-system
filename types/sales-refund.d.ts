export interface SalesRefund {
  salesRefId: number;
  salesId: number;
  storeId: number;
  salesRefAmount: number;
  salesRefCreatedAt: string;
  salesRefUpdatedAt?: string | null;
  salesRefDeletedAt?: string | null;
  salesRefReason?: string | null;
  salesRefCreatedBy: number;
  salesPaymentRefund: SalesPaymentRefund[];
}

export interface SalesItemRefund {
  salesItemRefId: number;
  salesRefId: number; // links to SalesRefund
  salesItemId: number; // links to SalesItem
  salesRefItemQty: number;
  salesRefItemPrice: number;
}

export interface SalesPaymentRefund {
  salesPayRefId: number;
  salesRefId: number; // links to SalesRefund
  payMetId: number; // links to PaymentMethod
  salesPayRefAmount: number;
  salesPayRefReference?: string | null;
}
