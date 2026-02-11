export type RequestStatus =
  | "pending"
  | "in_progress"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled"
  | "delivered"
  | "received"
  | "partial";
export type RequestItemStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "delivered"
  | "received"
  | "partial"
  | "not_ordered";
export interface Request {
  requestId: number;
  requestNo: string;
  storeId?: number | null;
  requestById: number;
  requestStatus?: RequestStatus;
  requestCreatedAt: string;
  requestUpdatedAt: string;
  requestDeletedAt: string;
  requestItems: RequestItems[];
  requestItemsData?: RequestItems[];
}

export interface RequestItems {
  reqItemId: number;
  requestId: number;
  invItem: number;
  reqItemQuantity: number;
  reqItemTransfer: number;
  reqItemReceived: number;
  reqItemRemarks: string;
  reqItemStatus: RequestItemStatus;
  inventoryItemReferenceId: number;
  itemId: number;
  reqItemToFollow?: number;
  receivedToFollow?: number;
  itemPrice?: number;
}
