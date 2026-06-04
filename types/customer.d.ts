export interface Customer {
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPhone: string;
  customerType: string;
  customerCreatedAt: string;
  customerUpdatedAt: string;
  customerDeletedAt: string;
  customerCreatedBy: number;
  storeId: number;
}

export interface CustomerAccount {
  customerAccountId: number;
  customerId: number;
  customerPassword: string;
  customerVerified: boolean;
  status: CustomerAccStatus;
  approvedBy: number;
  approvedAt: string;
  rejectionReason: string;
  rejectedAt: string;
  createdAt: string;
}

export type CustomerAccStatus =
  | "Pending_Verification"
  | "Pending_Approval"
  | "Approved"
  | "Rejected";
