import { updateBarcodes } from "@/models/barcodeModels";
import { Barcodes } from "@/types/barcode";
import { PoolConnection } from "mysql2/promise";

export async function deleteBarcode({
  connection,
  updates,
  keyFields = ["barcodeId"],
}: // 👈 optional per-field mode
{
  connection?: PoolConnection;
  updates: Partial<Barcodes>[];
  keyFields?: (keyof Barcodes)[];
}) {
  return await updateBarcodes({ connection, updates, keyFields });
}
