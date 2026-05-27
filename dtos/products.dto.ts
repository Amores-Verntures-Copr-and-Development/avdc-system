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
  "storeId" | "prodCatId" | "prodCreatedBy" | "prodName"
> & {
  productVariants?: CreateProductVariantDto[];
};

export type CreateProductVariantDto = Pick<
  ProductVariants,
  | "prodId"
  | "prodVarCreatedBy"
  | "prodVarName"
  | "prodVarPrice"
  | "prodVarUnit"
  | "isDeductInv"
  | "inventoryItemId"
> & {
  variantComponents?: CreateVarianComponentDto[];
};

export type CreateVarianComponentDto = Pick<
  VariantComponents,
  "inventoryItemId" | "quantityRequired" | "prodVarId" | "isDeductVar"
>;

export interface CreateProductItemDtos {
  item: CreateItemDto;
  product: CreateProductDtos;
  inventoryItem: CreateInventoryItemDto;
  storeId: number;
}

export interface DisplayProductsDtos
  extends Products, StoreInterface, ProductCategories {}

export interface DisplaProductVariantsDtos extends ProductVariants, Products {
  sold?: number;
  inventoryItemQuantity: number | null;
  totalSales?: number;
  variantComponents: DisplayVariantComponents[];
}

export interface DisplayVariantComponents
  extends VariantComponents, InventoryItemInterface, ItemInterface {}

export type CreateProductCategoryDto = Pick<
  ProductCategories,
  "prodCatCreatedBy" | "prodCatName" | "storeId"
>;
