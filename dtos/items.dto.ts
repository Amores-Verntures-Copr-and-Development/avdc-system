import { CategoryInterface } from "@/types/categories";
import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
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

export type ImportItemDto = Pick<
  ItemInterface,
  "itemName" | "itemUnit" | "itemPrice" | "itemDescription" | "itemAddedBy"
> &
  Pick<CategoryInterface, "categoryName">;

export type ImportItemInfo = Pick<InventoryInterface, "inventoryId"> & {
  importedBy: number;
  items: ImportItemDto[];
};
