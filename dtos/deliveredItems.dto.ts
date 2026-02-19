import { DeliveredItems } from "@/models/deliveredItems";

export type CreateDeliveredItemsDto = Pick<
  DeliveredItems,
  | "itemId"
  | "delItemAddedBy"
  | "requestId"
  | "unitPrice"
  | "reqItemId"
  | "delItemQuantity"
>;
