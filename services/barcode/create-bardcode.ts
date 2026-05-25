import { CreateBarcodeDto } from "@/dtos/barcode.dto";
import { insertBarcode } from "@/models/barcodeModels";
import { PoolConnection } from "mysql2/promise";

export async function createBarcode({
  data,
  connection,
}: {
  data: CreateBarcodeDto[];
  connection?: PoolConnection;
}) {
  return await insertBarcode({ data, connection });
}
