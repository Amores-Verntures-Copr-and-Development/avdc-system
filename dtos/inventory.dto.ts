import {
  InventoryInterface,
  InventoryItemInterface,
  InventoryItemMovement,
} from "@/types/inventory";
import { CreateItemDto } from "./items.dto";
import { ItemInterface } from "@/types/items";
import { CategoryInterface } from "@/types/categories";

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
  extends CreateInventoryDto,
    CreateInventoryItemDto {}

export interface CreateFirstItem
  extends CreateItemDto,
    CreateInventoryItemDto {}

export interface DisplayInventoryItems {
  inventoryId: number;
  itemId: number;
  inventoryItemId: number;
  inventoryItemReferenceId: number;
  inventoryItemQuantity: number; // if you want numbers, parse it before use
  itemPrice: string;
  inventoryItemMin: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
  storeId: number | null;
  inventoryItemReferenceType: string;
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
  | "itemMovementCreatedAt"
> &
  Pick<ItemInterface, "itemId" | "itemName" | "itemUnit" | "itemPrice"> &
  Pick<CategoryInterface, "categoryName" | "categoryType">;
