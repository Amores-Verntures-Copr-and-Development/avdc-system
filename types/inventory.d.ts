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

// Only meaningful when itemMovementReference is "adjustment" - a structured
// classification alongside the free-text itemMovementRemarks, so adjustments
// can be filtered/reported on (e.g. "how much shrinkage was from damage").
export type AdjustmentReason =
  | "damage"
  | "loss"
  | "expiry"
  | "count_correction"
  | "other";

export interface InventoryItemMovement {
  invItemMovementId: number;
  inventoryId: number;
  inventoryItemId: number;
  itemMovementType: "in" | "out";
  itemMovementReferenceId: number | null;
  itemMovementReference:
    | "sales"
    | "po"
    | "adjustment"
    | "ro"
    | "convert"
    | "refund"
    | "initial"
    | "stocking";
  itemMovementQuantity: number;
  itemMovementRemarks?: string;
  itemMovementReason?: AdjustmentReason | null;
  itemMovementCreatedAt?: string;
}

export interface InventoryReport {
  invReportId: number;
  invReportFrom: string;
  invReportTo: string;
  reportId: number;
}

export interface InventoryReportItem {
  invRepItemId: number;
  invRepItemTotalIn: number;
  invRepItemTotalOut: number;
  invRepCurrentStock: number;
  invReportId: number;
  itemId: number;
}

export interface DailyReport {
  dailyReportId: number;
  dailyRepOpen: number;
  dailyRepClose: number;
  reportId: number;
  itemId: number;
}
