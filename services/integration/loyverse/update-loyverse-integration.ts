import { updateLoyverseIntegration } from "@/models/loyverseIntegrationModels";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { PoolConnection } from "mysql2/promise";

export async function updateLoyverseIntegrationByFields({
  connection,
  updates,
  keyFields = ["integId"],
}: {
  connection?: PoolConnection;
  updates: Partial<LoyverseIntegrationInterface>[];
  keyFields?: (keyof LoyverseIntegrationInterface)[];
}) {
  return await updateLoyverseIntegration({ connection, keyFields, updates });
}
