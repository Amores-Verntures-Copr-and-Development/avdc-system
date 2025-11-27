import { selectInventoryReports } from "@/models/reportModels";
import { InventoryReport } from "@/types/inventory";
import { Reports } from "@/types/report";

export async function findInventoryReportByInventoryId({
  inventoryId,
}: {
  inventoryId: number;
}) {
  try {
  } catch (e) {}
}

export async function findInventoryReportWithItem({
  keyInvRepFields = {},
  keyReportFields = {},
}: {
  keyInvRepFields?: Partial<InventoryReport>;
  keyReportFields?: Partial<Reports>;
}) {
  try {
    const data = await selectInventoryReports({
      keyInvRepFields,
      keyReportFields,
    });
    return data;
  } catch (e) {
    throw e;
  }
}
