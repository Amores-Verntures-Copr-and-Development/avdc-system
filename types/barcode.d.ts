export interface Barcodes {
  barcodeId: number;

  barcode: string;

  prodVarId: number | null;
  inventoryItemId: number | null;

  createdBy: number;

  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt: Date | string | null;
}
