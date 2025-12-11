import { CategoryInterface } from "@/types/categories";
import { InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import { Products, ProductVariants, VariantComponents } from "@/types/products";
import { CreateItemDto } from "./items.dto";
import { CreateInventoryItemDto } from "./inventory.dto";

export type CreateProductDtos = Pick<
  Products,
  "storeId" | "prodCatId" | "prodCreatedBy" | "prodName" | "productVariants"
>;

export type CreateProductVariantDto = Pick<
  ProductVariants,
  | "prodId"
  | "prodVarCreatedBy"
  | "prodVarName"
  | "prodVarPrice"
  | "prodVarCreatedAt"
  | "varianComponents"
>;

export type CreateVarianComponentDto = Pick<
  VariantComponents,
  "inventoryItemId" | "quantityRequired" | "prodVarId"
>;

export interface CreateProductItemDtos {
  item: CreateItemDto;
  product: CreateProductDtos;
  inventoryItem: CreateInventoryItemDto;
  storeId: number;
}

export interface DisplayProductsDtos
  extends ItemInterface,
    InventoryItemInterface,
    Products,
    CategoryInterface {}
