import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";

export type CreateLoyverseIntegrationDTO = Pick<
  LoyverseIntegrationInterface,
  | "integId"
  | "accessToken"
  | "refreshToken"
  | "createdBy"
  | "scope"
  | "tokenType"
>;
