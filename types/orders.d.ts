export type OrderFulfillmentType = "PICKUP" | "DELIVERY";

export type OrderPaymentStatus =
  | "UNPAID"
  | "PARTIALLY_PAID"
  | "PAID"
  | "REFUNDED";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "OUT_FOR_DELIVERY"
  | "COMPLETED"
  | "CANCELLED";

export interface Orders {
  orderId: number;
  orderPublicId: string;

  storeId: number;
  customerId: number | null;
  orderNumber: string;

  fulfillmentType: OrderFulfillmentType;
  deliveryAddress: string | null;

  payMetId: number;
  paymentReference: string | null;
  paymentStatus: OrderPaymentStatus;

  orderStatus: OrderStatus;

  customerNotes: string | null;
  internalNotes: string | null;

  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  totalAmount: number;

  orderCreatedAt: string;
  orderUpdatedAt: string;
  orderDeletedAt: string | null;
}

export type OrderItemStatus =
  | "PENDING"
  | "FULFILLED"
  | "OUT_OF_STOCK"
  | "SUBSTITUTED";

export interface OrderItems {
  orderItemId: number;
  orderId: number;
  prodVarId: number;

  quantity: number;
  unitPrice: number;
  lineTotal: number;

  itemStatus: OrderItemStatus;

  notes: string | null;

  orderItemCreatedAt: string;
  orderItemUpdatedAt: string;
}
