import {
  CreateISRDto,
  CreateISRPurchaserDto,
  CreateISRRequestHandlerDto,
  CreateISRStoreDto,
} from "@/dtos/isr.dto";
import { createISR } from "@/services/isr/create-isr";
import { getISRByFields, getISRUserInfoById } from "@/services/isr/get-isr";
import { createISRPurchaser } from "@/services/isr/isr-purchaser/create-isr-purchaser";
import { deleteISRPurcahserByID } from "@/services/isr/isr-purchaser/delete-isr-purchaser";
import { getISRPurchaser } from "@/services/isr/isr-purchaser/get-isr-purchaser";
import { createISRRequestHandler } from "@/services/isr/isr-request-handler/create-isr-request-handler";
import { deleteISRRequestHandlerByID } from "@/services/isr/isr-request-handler/delete-isr-request-handler";
import { getISRRequestHandler } from "@/services/isr/isr-request-handler/get-isr-request-handler";
import { createISRStore } from "@/services/isr/isr-store/create-isr-store";
import { deleteISRStoreByID } from "@/services/isr/isr-store/delete-isr-store";
import {
  getISRStores,
  getStoreNotInISR,
} from "@/services/isr/isr-store/get-isr-store";

import {
  InterStoreRequests,
  ISRPurchasers,
  ISRRequestHandlers,
  ISRStores,
} from "@/types/isr";
import { PoolConnection } from "mysql2/promise";

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
      const res = await getISRByFields({ keyFields });
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
  getISRUserInfo: async (userId: number) => {
    try {
      const res = await getISRUserInfoById(userId);
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

  deleteISRPurchaserByISRPurID: async (id: number) => {
    try {
      await deleteISRPurcahserByID({ isrPurId: id });
      return {
        success: true,
        message: "ISR Purchaser remove successfully!",
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to remove ISR Purchaser",
      };
    }
  },
};

export const ISRRequestHandlerController = {
  createISRRequestHandler: async ({
    data,
  }: {
    data: CreateISRRequestHandlerDto;
  }) => {
    try {
      const res = await createISRRequestHandler({ data });
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
  getISRRequestHandler: async ({
    keyFields = {},
    code,
  }: {
    keyFields?: Partial<Record<keyof ISRRequestHandlers, any>>;
    code?: string;
  }) => {
    try {
      const res = await getISRRequestHandler({ keyFields, code });
      return {
        success: true,
        data: res.data,
        count: res.count,
      };
    } catch (e) {
      console.log({ e });
      return {
        success: false,
        error: e,
      };
    }
  },
  deleteISRRequestHandlerByID: async (id: number) => {
    try {
      await deleteISRRequestHandlerByID({ isrReqHanId: id });
      return {
        success: true,
        message: "ISR Request Handler remove successfully!",
      };
    } catch (e) {
      console.log({ e });
      return {
        success: false,
        message: "Failed to remove ISR Request Handler!",
      };
    }
  },
};

export const ISRStoreController = {
  createISRStore: async ({ data }: { data: CreateISRStoreDto }) => {
    try {
      const res = await createISRStore({ data });
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
  getISRStores: async ({
    keyFields = {},
    code,
  }: {
    keyFields?: Partial<Record<keyof ISRStores, any>>;
    code?: string;
  }) => {
    try {
      const res = await getISRStores({ keyFields, code });
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

  getStoreNotInISR: async ({
    keyFields = {},
    connection,
    limit,
    search,
  }: {
    keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
    connection?: PoolConnection;
    limit: number;
    search?: string;
  }) => {
    try {
      const res = await getStoreNotInISR({
        keyFields,
        connection,
        limit,
        search,
      });
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
  deleteISRStoresByID: async (id: number) => {
    try {
      await deleteISRStoreByID({ isrStoreId: id });
      return {
        success: true,
        message: "ISR Store remove successfully!",
      };
    } catch (e) {
      console.log({ e });
      return {
        success: false,
        message: "Failed to remove ISR Store!",
      };
    }
  },
};
