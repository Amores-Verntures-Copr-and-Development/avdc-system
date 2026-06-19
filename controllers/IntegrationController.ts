import { getIntegrationByFields } from "@/services/integration/get-integration";
import { getLoyverseIntegratioByFields } from "@/services/integration/loyverse/get-loyverse-integration";
import { IntegrationInterface } from "@/types/integrations";
import { LoyverseIntegrationInterface } from "@/types/loyverse-integration";
import { PoolConnection } from "mysql2/promise";

export const IntegrationController = {
  get: async ({
    keyFields = {},
  }: {
    keyFields?: Partial<Record<keyof IntegrationInterface, any>>;
  }) => {
    try {
      const res = await getIntegrationByFields({ keyFields });
      return {
        success: true,
        message: "Integration fetched successfully!",
        data: res,
        count: 0,
      };
    } catch (e) {
      return {
        success: false,
        message: "Integration fetched failed!!",
        error: e,
      };
    }
  },
};

export const LoyverseIntegrationController = {
  get: async ({
    connection,
    keyFields = {},
  }: {
    connection?: PoolConnection;
    keyFields: Partial<Record<keyof LoyverseIntegrationInterface, any>>;
  }) => {
    try {
      const res = await getLoyverseIntegratioByFields({
        connection,
        keyFields,
      });
      return {
        success: true,
        message: "Loyverse Integration fetched successfully!",
        data: res,
        count: 0,
      };
    } catch (e) {
      return {
        success: false,
        message: "Loyverse Integration fetched failed!!",
        error: e,
      };
    }
  },
};
