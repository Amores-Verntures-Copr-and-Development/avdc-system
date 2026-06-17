import { CreateIntegrationDTO } from "@/dtos/integration.dto";
import { insertIntegration } from "@/models/integrationModels";
import { PoolConnection } from "mysql2/promise";

export async function createIntegration({
  data,
  connection,
}: {
  data: CreateIntegrationDTO;
  connection: PoolConnection;
}) {
  return await insertIntegration({ data, connection });
}
