import {
  CreateInventoryItemReportDto,
  CreateInventoryReportDto,
} from "@/dtos/report.dto";
import { PoolConnection } from "mysql2/promise";
import { createInventoryReport } from "../create-inventory-report";
import { createInventoryReportItems } from "./create-inventory-report-item";

export async function handleCreateInventoryReport({
  data,
  connection,
}: {
  data: CreateInventoryReportDto;
  connection: PoolConnection;
}) {
  try {
    const inventoryReportId = await createInventoryReport({
      data,
      connection,
    });

    const invetoryReportItem: CreateInventoryItemReportDto[] =
      data.invetoryReportItem.map((item) => ({
        ...item,
        invReportId: inventoryReportId,
      }));

    await createInventoryReportItems({ data: invetoryReportItem, connection });
  } catch (e) {}
}
