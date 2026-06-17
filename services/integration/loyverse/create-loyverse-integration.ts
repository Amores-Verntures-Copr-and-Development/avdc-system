import { CreateLoyverseIntegrationDTO } from "@/dtos/loyverse-integration.dto";
import { insertLoyverseIntegration } from "@/models/loyverseIntegrationModels";
import { PoolConnection } from "mysql2/promise";

export async function createLoyverseIntegration({
  data,
  connection,
}: {
  data: CreateLoyverseIntegrationDTO;
  connection: PoolConnection;
}) {
  return await insertLoyverseIntegration({ data, connection });
}
