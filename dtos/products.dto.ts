import { CategoryInterface } from "@/types/categories";
import { InventoryItemInterface } from "@/types/inventory";
import { ItemInterface } from "@/types/items";
import {
  ProductCategories,
  Products,
  ProductVariants,
  VariantComponents,
} from "@/types/products";
import { CreateItemDto } from "./items.dto";
import { CreateInventoryItemDto } from "./inventory.dto";
import { StoreInterface } from "@/types/stores";
import { UserInterface } from "@/types/users";

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
  | "variantComponents"
  | "prodVarUnit"
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
  extends Products,
    StoreInterface,
    ProductCategories {}

export interface DisplaProductVariantsDtos extends ProductVariants {}

export type CreateProductCategoryDto = Pick<
  ProductCategories,
  "prodCatCreatedBy" | "prodCatName" | "storeId"
>;
