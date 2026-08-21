import {
  InventoryInterface,
  InventoryItemInterface,
  InventoryItemMovement,
  InventoryReferenceType,
} from "@/types/inventory";
import { CreateItemDto } from "./items.dto";
import { ItemInterface } from "@/types/items";
import { CategoryInterface } from "@/types/categories";
import { Supplier, SupplierItem } from "@/types/supplier";

export type CreateInventoryDto = Pick<
  InventoryInterface,
  | "inventoryCreatedBy"
  | "inventoryDescription"
  | "inventoryReference"
  | "inventoryReferenceId"
>;

export type CreateInventoryItemDto = Pick<
  InventoryItemInterface,
  | "inventoryId"
  | "inventoryItemReferenceType"
  | "inventoryItemReferenceId"
  | "inventoryItemMin"
  | "inventoryItemQuantity"
  | "inventoryItemCreatedBy"
>;

export interface CreateInventoryWithItemDto
  extends CreateInventoryDto, CreateInventoryItemDto {}

export interface CreateFirstItem
  extends CreateItemDto, CreateInventoryItemDto {}

export interface DisplayInventoryItems {
  inventoryId: number;
  itemId: number;
  inventoryItemId: number;
  inventoryItemReferenceId: number;
  inventoryItemQuantity: number; // if you want numbers, parse it before use
  itemPrice: number;
  inventoryItemMin: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
  storeId: number | null;
  inventoryItemReferenceType: InventoryReferenceType;
  reqItemQuantity?: number;
  itemSuppliers: SupplierItemsData[];
}

export interface SupplierItemsData extends Supplier, SupplierItem {}

export interface DuplicateInventoryItemRow {
  inventoryItemId: number;
  inventoryId: number;
  inventoryItemReferenceType: InventoryReferenceType;
  inventoryItemReferenceId: number;
  inventoryItemQuantity: number;
  inventoryItemMin: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
}

export interface DuplicateInventoryItemGroup {
  inventoryItemReferenceType: InventoryReferenceType;
  inventoryItemReferenceId: number;
  itemName: string;
  itemUnit: string;
  duplicateCount: number;
  items: DuplicateInventoryItemRow[];
}

export type CreateInventoryMovementDto = Pick<
  InventoryItemMovement,
  | "inventoryId"
  | "inventoryItemId"
  | "itemMovementQuantity"
  | "itemMovementReferenceId"
  | "itemMovementReference"
  | "itemMovementRemarks"
  | "itemMovementType"
> &
  Partial<
    Pick<
      InventoryItemMovement,
      "itemMovementCreatedAt" | "itemMovementReason"
    >
  >;

export type DisplayInventoryMovementDto = Pick<
  InventoryItemMovement,
  | "invItemMovementId"
  | "inventoryId"
  | "inventoryItemId"
  | "itemMovementType"
  | "itemMovementReferenceId"
  | "itemMovementReference"
  | "itemMovementQuantity"
  | "itemMovementRemarks"
  | "itemMovementReason"
  | "itemMovementCreatedAt"
> &
  Pick<ItemInterface, "itemId" | "itemName" | "itemUnit" | "itemPrice"> &
  Pick<CategoryInterface, "categoryName" | "categoryType">;

export type ConvertInventoryItems = Pick<
  InventoryItemInterface,
  "inventoryItemId" | "inventoryItemQuantity"
> & {
  itemId: number;
};

export type ConvertInventoryItemsDto = {
  from: ConvertInventoryItems;
  to: ConvertInventoryItems;
  convertedBy: number;
  inventoryId: number;
};
