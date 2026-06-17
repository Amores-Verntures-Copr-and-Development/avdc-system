import { IntegrationInterface } from "@/types/integrations";

export type CreateIntegrationDTO = Pick<
  IntegrationInterface,
  "storeId" | "integrationType"
>;
