import { CategoryInterface } from "@/types/categories";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { ItemConversions, ItemInterface, ItemPrice } from "@/types/items";

export type CreateItemDto = Pick<
  ItemInterface,
  | "itemName"
  | "categoryId"
  | "itemAddedBy"
  | "itemDescription"
  | "itemUnit"
  | "itemPrice"
>;

export type ImportItemDto = Pick<
  ItemInterface,
  "itemName" | "itemUnit" | "itemPrice" | "itemDescription" | "itemAddedBy"
> &
  Pick<CategoryInterface, "categoryName">;

export type ImportItemInfo = Pick<InventoryInterface, "inventoryId"> & {
  importedBy: number;
  items: ImportItemDto[];
};

export type CreateItemPriceDto = Pick<
  ItemPrice,
  "itemId" | "itemPriceAmount" | "itemPriceCreatedBy"
>;

export type CreateItemConversionDto = Pick<
  ItemConversions,
  | "fromItemId"
  | "fromUnit"
  | "fromQuantity"
  | "toItemId"
  | "toUnit"
  | "toQuantity"
  | "itemConCreatedBy"
>;

export interface DisplayItemConversionFromTo extends ItemConversions {
  fromItemName: number;
  toItemName: number;
}
