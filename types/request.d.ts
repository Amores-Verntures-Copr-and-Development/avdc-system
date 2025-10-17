export type RequestStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "delivered"
  | "received";

export interface Request {
  requestId: number;
  requestNo: string;
  storeId: number;
  requestById: number;
  requestStatus: RequestStatus;
  requestCreatedAt: string;
  requestUpdatedAt: string;
  requestDeletedAt: string;
  requestItems: RequestItems[];
}

export interface RequestItems {
  reqItemId: number;
  requestId: number;
  invItem: number;
  reqItemQuantity: number;
  reqItemTransfer: number;
  reqItemReceived: number;
  reqItemRemarks: string;
  inventoryItemReferenceId: number;
  itemId: number;
}
