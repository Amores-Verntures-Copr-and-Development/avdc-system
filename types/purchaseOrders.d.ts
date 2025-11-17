import { types } from "util";

export type PurchaseOrderStatus =
  | "pending"
  | "approved"
  | "sent"
  | "received"
  | "completed";

export type PurchaseOrderItemStatus =
  | "pending"
  | "approved"
  | "sent"
  | "received"
  | "completed"
  | "delivered";

export interface PurchaseOrders {
  poId: number;
  poNumber: string;
  poDescription: string;
  poStatus: PurchaseOrderStatus;
  poCreatedAt: string;
  poUpdatedAt: string;
  poDeletedAt: string;
  poCreatedBy: number;
  purchaseOrderRequest: PurchaseOrderRequest[];
  purchaseOrderItems: PurchaseOrderItems[];
  poCreatedByName;
  updatedBy: number;
}

export interface PurchaseOrderRequest {
  poReqId: number;
  poId: number;
  requestId: number;
  requestNo?: string;
}

export interface PurchaseOrderItems {
  poItemId: number;
  poId: number;
  itemId: number;
  unitPrice: number;
  poItemOrderedQty: number;
  poItemReceivedQty: number;
  suppId: number;
  itemName?: string;
  itemUnit?: string;
  isSent?: number;
  poItemStatus?: PurchaseOrderItemStatus;
}
