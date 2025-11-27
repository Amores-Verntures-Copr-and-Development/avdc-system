import {
  CreateInventoryItemReportDto,
  CreateInventoryReportDto,
  CreateReportDto,
} from "@/dtos/report.dto";
import { createReport } from "./create-report";
import { getDBConnection } from "@/lib/db";
import { createInventoryReport } from "./inventoryReport/create-inventory-report";
import { createInventoryReportItems } from "./inventoryReport/inventoryReportItem/create-inventory-report-item";
import { findStoreByInventoryFields } from "../store/get-store";
import { off } from "process";
import { handleCreateInventoryReport } from "./inventoryReport/inventoryReportItem/handle-create-inventory-report";
import { getReport } from "./get-report";

export async function handleCreateReport(data: CreateReportDto) {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    if (data.reportType === "inventory") {
      const inventoryReferenceStore = await findStoreByInventoryFields({
        keyFields: {
          inventoryId: data.inventoryId,
        },
      });
      const reports = await getReport({
        keyFields: { inventoryId: data.inventoryId, reportType: "inventory" },
      });
      const reportTitle = `${inventoryReferenceStore[0].storeName
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-INV-REPORT-${String(
        reports.length + 1
      ).padStart(3, "0")}`;
      const reportData: CreateReportDto = {
        ...data,
        reportTitle: reportTitle,
      };
      const id = await createReport({ data: reportData, connection });
      const invetoryReportData: CreateInventoryReportDto = {
        ...data.inventoryReport,
        reportId: id,
      };
      await handleCreateInventoryReport({
        connection,
        data: invetoryReportData,
      });
    } else if (data.reportType === "daily") {
    } else if (data.reportType === "sales") {
    } else {
      throw new Error("Report type is invalid!");
    }

    await connection.commit();
  } catch (e) {
    await connection.rollback();
    throw e;
  } finally {
    connection.release();
  }
}
