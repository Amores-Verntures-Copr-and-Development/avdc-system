type ReportType = "inventory" | "daily" | "sales";

export interface Reports {
  reportId: number;
  reportTitle: string;
  reportType: ReportType;
  reportCreatedAt: string;
  reportUpdatedAt: string;
  reportDeletedAt: string;
  inventoryId: number;
  invReportCreatedBy: number;
}
