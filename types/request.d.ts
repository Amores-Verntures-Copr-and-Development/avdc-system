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
  | "removed"
  | "completed"
  | "cancelled"
  | "delivered"
  | "received"
  | "partial"
  | "not_ordered"
  | "received_store"
  | "";
export interface Request {
  requestDesc: string;
  requestId: number;
  requestNo: string;
  storeId?: number | null;
  requestById: number;
  requestStatus?: RequestStatus;
  requestCreatedAt: string;
  requestUpdatedAt: string;
  requestDeletedAt: string | null;
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
  unitPrice?: number;
}
