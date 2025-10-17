import { ItemInterface } from "@/types/items";

export type CreateItemDto = Pick<
  ItemInterface,
  | "itemName"
  | "categoryId"
  | "itemAddedBy"
  | "itemDescription"
  | "itemUnit"
  | "itemPrice"
>;
