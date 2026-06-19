import { selectLoyverseIntegration } from "@/models/loyverseIntegrationModels";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { PoolConnection } from "mysql2/promise";

export async function getLoyverseIntegratioByFields({
  connection,
  keyFields = {},
}: {
  connection?: PoolConnection;
  keyFields: Partial<Record<keyof LoyverseIntegrationInterface, any>>;
}) {
  return await selectLoyverseIntegration({ connection, keyFields });
}
