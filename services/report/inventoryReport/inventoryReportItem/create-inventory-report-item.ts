import { CreateInventoryItemReportDto } from "@/dtos/report.dto";
import { insertInventoryReportItems } from "@/models/reportModels";
import { PoolConnection } from "mysql2/promise";

export async function createInventoryReportItems({
  data,
  connection,
}: {
  data: CreateInventoryItemReportDto[];
  connection: PoolConnection;
}) {
  try {
    const id = await insertInventoryReportItems({ data, connection });
    return id;
  } catch (e) {
    throw e;
  }
}
