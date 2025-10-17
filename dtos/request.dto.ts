import { Request, RequestItems } from "@/types/request";

export type CreateRequestDto = Pick<
  Request,
  "requestById" | "storeId" | "requestNo"
>;
export type CreateRequestItemDto = Pick<
  RequestItems,
  "invItem" | "requestId" | "reqItemQuantity"
>;

export type InsertItemsRequestDto = Pick<
  RequestItems,
  "invItem" | "requestId" | "reqItemQuantity"
> & {
  itemName?: string;
};

export type CreateRequestFormDto = CreateRequestDto & {
  items: InsertItemsRequestDto[];
};

export type DisplayRequestOrderDto = Request & {
  totalItems: number;
  storeName: string;
  requestedByName: string;
};

export type DisplayRequestItems = RequestItems & {
  itemName: string;
  itemUnit: string;
  itemPrice: number;
};

export interface DisplayGroupedRequestItem {
  itemId: number;
  itemName: string;
  itemUnit: string;
  itemPrice: number;
  totalQuantity: number;
  totalReceived: number;
  stockItem: number;
}

export interface DisplayTotalOrderItem extends DisplayGroupedRequestItem {
  poItemOrder: number;
}

export type UpdateRequestDto = Partial<Request>;
