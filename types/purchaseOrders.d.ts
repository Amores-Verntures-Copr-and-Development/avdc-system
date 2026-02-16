import { DisplayOrderCompositeItemDto } from "@/app/purchase-orders/components/_components/ViewCompositePOItem";
import { types } from "util";

export type PurchaseOrderStatus =
  | "pending"
  | "approved"
  | "sent"
  | "received"
  | "completed"
  | "not_ordered";

export type PurchaseOrderItemStatus =
  | "pending"
  | "approved"
  | "sent"
  | "received"
  | "completed"
  | "delivered"
  | "not_ordered"
  | "removed"
  | "received_store";

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
  suppId?: number | null;
  itemName?: string;
  itemUnit?: string;
  isSent?: number;
  poItemStatus?: PurchaseOrderItemStatus;
  supplierPrice?: number;
  composite?: DisplayOrderCompositeItemDto[];
}

export interface OrderCompositeItem {
  ordComItemId: number;
  itemId: number;
  poItemId: number | null;
  reqItemId: number;
  ordComQuantity: number;
  ordComPrice: number;
  ordComCreatedBy: number;
  ordComCreatedAt: string;
  ordComUpdatedAt: string;
  ordComDeletedAt: string;
}
