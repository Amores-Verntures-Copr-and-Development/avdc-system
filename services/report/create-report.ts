import { CreateReportDto } from "@/dtos/report.dto";
import { insertReport } from "@/models/reportModels";
import { PoolConnection } from "mysql2/promise";

export async function createReport({
  data,
  connection,
}: {
  data: CreateReportDto;
  connection: PoolConnection;
}) {
  try {
    const id = await insertReport({ data, connection });
    return id;
  } catch (e) {
    throw e;
  }
}
