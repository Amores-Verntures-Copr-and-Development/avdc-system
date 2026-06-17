// integration.dto.ts

export type IntegrationType = "loyverse";

export interface IntegrationInterface {
  integId: number;
  storeId: number;
  integrationType: IntegrationType;
  integCreatedAt: Date;
  integUpdatedAt: Date;
  integDeletedAt?: Date | null;
}
