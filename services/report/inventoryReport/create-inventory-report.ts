import { CreateInventoryReportDto } from "@/dtos/report.dto";
import { insertInventoryReport } from "@/models/reportModels";
import { PoolConnection } from "mysql2/promise";

export async function createInventoryReport({
  data,
  connection,
}: {
  data: CreateInventoryReportDto;
  connection: PoolConnection;
}) {
  try {
    const id = await insertInventoryReport({ data, connection });
    return id;
  } catch (e) {
    throw e;
  }
}
