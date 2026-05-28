import { deleteBarcodes, updateBarcodes } from "@/models/barcodeModels";
import { Barcodes } from "@/types/barcode";
import { PoolConnection } from "mysql2/promise";

export async function deleteBarcode({
  connection,
  updates,
  keyFields = ["barcodeId"],
}: {
  connection?: PoolConnection;
  updates: Partial<Barcodes>[];
  keyFields?: (keyof Barcodes)[];
}) {
  try {
    // try normal update first
    return await updateBarcodes({
      connection,
      updates,
      keyFields,
    });
  } catch (error: any) {
    // if CHECK constraint fails, do actual delete
    if (error.code === "ER_CHECK_CONSTRAINT_VIOLATED") {
      return await deleteBarcodes({
        connection,
        updates,
        keyFields,
      });
    }

    throw error;
  }
}
