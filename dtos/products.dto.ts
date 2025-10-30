import { CategoryInterface } from "@/types/categories";
import { InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import { Products } from "@/types/products";

export type CreateProductDtos = Pick<
  Products,
  | "inventoryItemId"
  | "productCode"
  | "productCreatedBy"
  | "productDescription"
  | "productPrice"
  | "inventoryId"
>;

export interface DisplayProductsDtos
  extends ItemInterface,
    InventoryItemInterface,
    Products,
    CategoryInterface {}
