import { selectIntegration } from "@/models/integrationModels";
import { IntegrationInterface } from "@/types/integrations";
import { PoolConnection } from "mysql2/promise";

export async function getIntegrationByFields({
  connection,
  keyFields,
}: {
  connection?: PoolConnection;
  keyFields: Partial<Record<keyof IntegrationInterface, any>>;
}) {
  return await selectIntegration({ connection, keyFields });
}
