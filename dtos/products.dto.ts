import { CategoryInterface } from "@/types/categories";
import { InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import { Products } from "@/types/products";
import { CreateItemDto } from "./items.dto";
import { CreateInventoryItemDto } from "./inventory.dto";

export type CreateProductDtos = Pick<
  Products,
  | "inventoryItemId"
  | "productCode"
  | "productCreatedBy"
  | "productDescription"
  | "productPrice"
  | "isDeduct"
>;

export interface CreateProductItemDtos {
  item: CreateItemDto;
  product: CreateProductDtos;
  inventoryItem: CreateInventoryItemDto;
}

export interface DisplayProductsDtos
  extends ItemInterface,
    InventoryItemInterface,
    Products,
    CategoryInterface {}
