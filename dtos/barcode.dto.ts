import { Barcodes } from "@/types/barcode";

export type CreateBarcodeDto = Pick<
  Barcodes,
  "barcode" | "prodVarId" | "inventoryItemId" | "createdBy"
>;
