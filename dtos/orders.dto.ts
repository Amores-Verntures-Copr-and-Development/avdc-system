import { OrderItems, Orders } from "@/types/orders";

export type CreateOrderItemDto = Pick<
  OrderItems,
  "prodVarId" | "quantity" | "unitPrice"
> &
  Partial<Pick<OrderItems, "itemStatus" | "notes">>;

export type UpdateOrderItemDto = Pick<OrderItems, "orderItemId"> &
  Partial<
    Pick<OrderItems, "quantity" | "unitPrice" | "itemStatus" | "notes">
  >;

export interface DisplayOrderItemDto extends OrderItems {
  prodVarName: string;
  prodVarUnit?: string | null;
}

export interface DisplayOrderDto extends Orders {
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  payMetName?: string | null;
  storeName?: string | null;
}

export type CreateOrderDto = Pick<
  Orders,
  | "storeId"
  | "customerId"
  | "fulfillmentType"
  | "deliveryAddress"
  | "payMetId"
  | "paymentReference"
  | "customerNotes"
  | "subtotal"
  | "discountAmount"
  | "deliveryFee"
  | "totalAmount"
> &
  Partial<Pick<Orders, "paymentStatus" | "orderStatus" | "internalNotes">> & {
    items: CreateOrderItemDto[];
  };

export type UpdateOrderDto = Pick<Orders, "orderId"> &
  Partial<
    Pick<
      Orders,
      | "customerId"
      | "fulfillmentType"
      | "deliveryAddress"
      | "payMetId"
      | "paymentReference"
      | "paymentStatus"
      | "orderStatus"
      | "customerNotes"
      | "internalNotes"
      | "subtotal"
      | "discountAmount"
      | "deliveryFee"
      | "totalAmount"
    >
  >;
