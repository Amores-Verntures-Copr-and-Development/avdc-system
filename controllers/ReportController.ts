import { CreateReportDto } from "@/dtos/report.dto";
import { getReport } from "@/services/report/get-report";
import { handleCreateReport } from "@/services/report/handle-create-report";
import { Reports } from "@/types/report";

export const createReport = async (data: CreateReportDto) => {
  try {
    const res = await handleCreateReport(data);
    return {
      success: true,
      message: "Successfullyy created!",
      data: res,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create!",
      error: e,
    };
  }
};

export const getReports = async ({
  keyFields = {},
}: {
  keyFields: Partial<Reports>;
}) => {
  try {
    const data = await getReport({ keyFields });
    return {
      success: true,
      message: "Successfullyy fetched!",
      data: data,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to fetched!",
      error: e,
    };
  }
};
