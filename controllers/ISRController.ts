import { CreateISRDto } from "@/dtos/isr.dto";
import { createISR } from "@/services/isr/create-isr";
import { getISRByFields } from "@/services/isr/get-isr";
import { InterStoreRequests } from "@/types/isr";

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
