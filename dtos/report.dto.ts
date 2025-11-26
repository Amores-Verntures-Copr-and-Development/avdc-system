import {
  DailyReport,
  InventoryReport,
  InventoryReportItem,
} from "@/types/inventory";
import { Reports } from "@/types/report";

export type CreateReportDto = Pick<
  Reports,
  "inventoryId" | "invReportCreatedBy" | "reportTitle" | "reportType"
> & {
  inventoryReport: CreateInventoryReportDto;
};

export type CreateInventoryReportDto = Pick<
  InventoryReport,
  "reportId" | "invReportFrom" | "invReportTo"
> & {
  invetoryReportItem: CreateInventoryItemReportDto[];
};

export type CreateInventoryItemReportDto = Pick<
  InventoryReportItem,
  | "itemId"
  | "invReportId"
  | "invRepItemTotalIn"
  | "invRepItemTotalOut"
  | "invRepCurrentStock"
>;

export type CreateDailyReportDto = Pick<
  DailyReport,
  "itemId" | "dailyRepOpen" | "dailyRepClose" | "reportId"
>;
