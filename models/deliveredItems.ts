export type DelItemStatus = "delivered" | "received";

export interface DeliveredItems {
  delItemId: number;
  requestId: number;
  reqItemId: number;
  itemId: number;
  unitPrice: number;
  delItemQuantity: number;
  delItemStatus: DelItemStatus;
  delItemAddedBy: number;
  delItemCreatedAt: string;
  delItemUpdatedAt: string;
  delItemDeletedAt: string;
}
