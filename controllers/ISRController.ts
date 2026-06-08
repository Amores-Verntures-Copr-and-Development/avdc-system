import { CreateISRDto, CreateISRPurchaserDto } from "@/dtos/isr.dto";
import { createISR } from "@/services/isr/create-isr";
import { getISRByFields } from "@/services/isr/get-isr";
import { createISRPurchaser } from "@/services/isr/isr-purchaser/create-isr-purchaser";
import { getISRPurchaser } from "@/services/isr/isr-purchaser/get-isr-purchaser";
import { InterStoreRequests, ISRPurchasers } from "@/types/isr";

export const ISRController = {
  createISR: async ({ data }: { data: CreateISRDto }) => {
    try {
      const res = await createISR({ data });
      return {
        success: true,
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },
  getAllISRs: async () => {
    try {
      // Implement the logic to fetch all ISRs here
      // For example, you might have a service function like fetchAllISRs()
      const res = await getISRByFields({});
      return {
        success: true,
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },

  getISRByFields: async (
    keyFields?: Partial<Record<keyof InterStoreRequests, any>>,
  ) => {
    try {
      // Implement the logic to fetch all ISRs here
      // For example, you might have a service function like fetchAllISRs()
      const res = await getISRByFields({});
      return {
        success: true,
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },
};

export const ISRPurchaserController = {
  createISRPurchaser: async ({ data }: { data: CreateISRPurchaserDto }) => {
    try {
      const res = await createISRPurchaser({ data });
      return {
        success: true,
        data: res,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        error: e,
      };
    }
  },
  getISRPurchaser: async ({
    keyFields = {},
    code,
  }: {
    keyFields?: Partial<Record<keyof ISRPurchasers, any>>;
    code?: string;
  }) => {
    try {
      const res = await getISRPurchaser({ keyFields, code });
      return {
        success: true,
        data: res.data,
        count: res.count,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },
};
