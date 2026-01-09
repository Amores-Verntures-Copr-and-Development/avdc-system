import { ItemInterface } from "@/types/items";
import {
  PurchaseOrderItems,
  PurchaseOrderRequest,
  PurchaseOrders,
} from "@/types/purchaseOrders";
import { Supplier } from "@/types/supplier";
import { InventoryItemInterface } from "@/types/inventory";
import { Request, RequestItems } from "@/types/request";
import { StoreInterface } from "@/types/stores";

export type CreatePurchaseOrderDto = Pick<
  PurchaseOrders,
  "poCreatedBy" | "poNumber" | "poDescription"
>;

export type CreatePurchaseOrderRequestDto = Pick<
  PurchaseOrderRequest,
  "requestId" | "poId"
>;

export type CreatePurchaseOrderItemDto = Pick<
  PurchaseOrderItems,
  "itemId" | "poId" | "poItemOrderedQty" | "poItemReceivedQty" | "unitPrice"
>;

export interface CreatePurchaseOrderFormDto extends CreatePurchaseOrderDto {
  purchaseOrderRequest: CreatePurchaseOrderRequestDto[];
  purchaseOrderItems: CreatePurchaseOrderItemDto[];
}

export interface DisplayTotalRequestItem {
  requestId: number;
  reqItemId: number;
  itemName: string;
  itemUnit: string;
  itemPrice: number;
  reqItemQuantity: number;
  reqItemReceived: number;
  reqItemStock: number;
  poItemOrder: number;
}

export interface DisplayProcurementHistory {
  poId: number;
  poNumber: string;
  suppId: number;
  suppName: string;
  totalPurchase: number;
  poCreatedAt: string;
}
export type DisplayPurchaseOrderItemsDto = Pick<
  PurchaseOrderItems,
  | "poId"
  | "itemId"
  | "poItemId"
  | "poItemOrderedQty"
  | "poItemReceivedQty"
  | "unitPrice"
  | "suppId"
  | "poItemStatus"
> &
  Pick<ItemInterface, "itemName" | "itemUnit"> & {
    suppliers: SupplierItemDetails[] | null;
    selectedSupplierId?: number | null | string;
    totalPrice?: number;
  };

export type SupplierItemDetails = {
  suppId: number;
  suppName: string;
  suppItemPrice: number;
  suppItemCreatedBy: number;
};

export interface UpdatePurchaseOrdersDto extends Partial<PurchaseOrders> {
  updatedBy: number;
  poItems?: PurchaseOrderItems[];
}

export interface DisplayPOItemsSupplier extends Supplier {
  items: PurchaseOrderItems[];
}

export interface DisplayRequisitionWithItems
  extends Request,
    PurchaseOrders,
    StoreInterface {
  requestItemsData: RequestItemsCombine[];
}

export type RequestItemsCombine = Pick<
  ItemInterface,
  "itemName" | "itemPrice" | "itemUnit"
> &
  Pick<InventoryItemInterface, "inventoryItemQuantity"> &
  RequestItems & { stockRoomQty: number };

export interface DeliverItemsToStore {
  poId: number;
  storeId: number;
  requestId: number;
  items: (Partial<RequestItems> & { suppId?: number | null })[];
  poItems: Partial<PurchaseOrderItems>[];
}
