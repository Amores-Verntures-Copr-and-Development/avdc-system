import { selectBarcodes } from "@/models/barcodeModels";
import { Barcodes } from "@/types/barcode";

import { PoolConnection } from "mysql2/promise";

export async function getBarcodeByFields({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields?: Partial<Record<keyof Barcodes, any>>;
  search?: string;
}) {
  return await selectBarcodes({ connection, keyFields });
}
