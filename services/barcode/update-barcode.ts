import { updateBarcodes } from "@/models/barcodeModels";
import { Barcodes } from "@/types/barcode";
import { PoolConnection } from "mysql2/promise";

export async function updateBarcodesByFields({
  connection,
  updates,
  keyFields = ["barcodeId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Barcodes>[];
  keyFields?: (keyof Barcodes)[];
}) {
  try {
    await updateBarcodes({ connection, updates, keyFields });
  } catch (e) {
    throw e;
  }
}
