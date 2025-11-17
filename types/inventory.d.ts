type InvetoryRefence = "stock-room" | "store";
export interface InventoryInterface {
  inventoryId: number;
  inventoryDescription: string;
  inventoryReference: InvetoryRefence;
  inventoryReferenceId: number | null;
  inventoryCreatedAt: string;
  inventoryUpdatedAt: string;
  inventoryDeletedAt?: string | null;
  inventoryCreatedBy?: number | null;
}

export type InventoryReferenceType = "product" | "item";

export interface InventoryItemInterface {
  inventoryItemId: number;
  inventoryId: number;
  inventoryItemReferenceType: InventoryReferenceType;
  inventoryItemReferenceId: number;
  inventoryItemQuantity: number;
  inventoryItemMin: number;
  inventoryItemPrice: number;
  inventoryItemCreatedAt: string;
  inventoryItemUpdatedAt: string;
  inventoryItemDeletedAt: string;
  inventoryItemCreatedBy: number;
}

export type InventoryReferenceType = "product" | "item";

// export interface InventoryItemInterface {
//   inventoryItemId: number;
//   inventoryId: number;
//   inventoryReferenceType: InventoryReferenceType;
//   inventoryReferenceId: number;
//   inventoryAddedBy: number;
//   inventoryQuantity: number;
//   inventoryCreatedAt: string;
//   inventoryUpdatedAt: string;
// }

export type InventoryLogType = "IN" | "OUT" | "ADJUSTMENT";

export interface InventoryLogInterface {
  inventoryLogId: number;
  inventoryId: number;
  logType: InventoryLogType;
  logDescription?: string | null;
  logCreatedAt: string;
  logCreatedBy: number; // userId
}

export interface InventoryItemMovement {
  invItemMovementId: number;
  inventoryId: number;
  inventoryItemId: number;
  itemMovementType: "in" | "out";
  itemMovementReferenceId: number | null;
  itemMovementReference: "sales" | "po" | "adjustment" | "ro";
  itemMovementQuantity: number;
  itemMovementRemarks?: string;
  itemMovementCreatedAt?: string;
}
