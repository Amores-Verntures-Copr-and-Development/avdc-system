import { InventoryInterface, InventoryItemInterface } from "@/types/inventory";
import { CreateItemDto } from "./items.dto";

export type CreateInventoryDto = Pick<
  InventoryInterface,
  "inventoryCreatedBy" | "storeId" | "inventoryDescription"
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
  itemId: string;
  inventoryItemId: number;
  inventoryItemReferenceId: number;
  inventoryItemQuantity: number; // if you want numbers, parse it before use
  itemPrice: string;
  inventoryItemMin: number;
  itemName: string;
  itemUnit: string;
  categoryName: string;
  storeId: number | null;
}
