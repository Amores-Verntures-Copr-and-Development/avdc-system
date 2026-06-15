import {
  CreateStockPurchaser,
  CreateStockRoom,
  CreateStockRoomUserDTO,
  CreateStockStore,
} from "@/dtos/stockRoom.dto";
import {
  findStockRoomBySPFields,
  getStockRoom,
} from "@/services/stock-room/get-stock-room";
import { processCreateStockRoom } from "@/services/stock-room/process-create-stock-room";
import { createStockPurchaser } from "@/services/stock-room/stock-purchaser/create-stock-purchaser";
import {
  findUsersNotInStockPurchaser,
  selectStockPurchaserBySPKeyFields,
} from "@/services/stock-room/stock-purchaser/get-stock-purchasers";
import {
  createStockRoomUser,
  createStockRoomUserBulk,
} from "@/services/stock-room/stock-room-user/create-stock-room-user";
import { deleteStockRoomUserByFields } from "@/services/stock-room/stock-room-user/delete-stock-roomn-user";
import {
  selecteStockRoomByFields,
  selectStockRoomUserNotInStockRomID,
} from "@/services/stock-room/stock-room-user/get-stock-room-user";
import { updateStockRoomUserByFields } from "@/services/stock-room/stock-room-user/update-stock-room-user";
import { createStockStores } from "@/services/stock-room/stock-store/create-stock-store";
import {
  findStockStoresBySSKeyFields,
  findStockStoresByStockRoomKeyFields,
} from "@/services/stock-room/stock-store/get-stock-store";
import {
  StockPurchasers,
  StockRoom,
  StockRoomUsers,
  StockStores,
} from "@/types/stockRoom";
import { PoolConnection } from "mysql2/promise";

export const createStockRooms = async (data: CreateStockRoom) => {
  try {
    const res = await processCreateStockRoom(data);
    return {
      success: true,
      result: res,
      message: "Stock Room created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to create Stock Room!",
    };
  }
};

export const createStockStore = async (data: CreateStockStore[]) => {
  try {
    const res = await createStockStores({ data });
    return {
      success: true,
      result: res,
      message: "Stock Room created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to create Stock Room!",
    };
  }
};

export const createStockPurchasers = async (data: CreateStockPurchaser[]) => {
  try {
    const res = await createStockPurchaser({ data });
    return {
      success: true,
      result: res,
      message: "Stock Purchaser added successfully!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed to add Stock Purchaser!",
    };
  }
};

export const getStockRooms = async ({
  keySPFields = {},
}: {
  keySPFields?: Partial<StockPurchasers>;
}) => {
  try {
    let data;
    if (Object.keys(keySPFields).length > 0) {
      data = await findStockRoomBySPFields({ keyFields: keySPFields });
    } else {
      data = await getStockRoom({});
    }

    return {
      success: true,
      data: data,
      message: "Success fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed fetched!",
    };
  }
};

export const getStockStores = async ({
  stockStoresKeyFields,
  stockRoomKeyFields,
}: {
  stockStoresKeyFields?: Partial<StockStores>;
  stockRoomKeyFields?: Partial<StockRoom>;
}) => {
  try {
    const data = await findStockStoresByStockRoomKeyFields({
      keyFields: stockRoomKeyFields,
    });
    return {
      success: true,
      data: data,
      message: "Success fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed fetched!",
    };
  }
};

export const searchStockRooms = async ({
  stockStoresKeyFields,
  stockRoomKeyFields,
}: {
  stockStoresKeyFields?: Partial<StockStores>;
  stockRoomKeyFields?: Partial<StockRoom>;
}) => {
  try {
    const data = await findStockStoresBySSKeyFields({
      keyFields: stockStoresKeyFields,
    });
    return {
      success: true,
      data: data,
      message: "Success fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed fetched!",
    };
  }
};

export const getStockPurchasers = async ({
  stockPurchaserFields,
}: {
  stockPurchaserFields: Partial<StockPurchasers>;
}) => {
  try {
    const data = await selectStockPurchaserBySPKeyFields({
      stockPurchaserFields,
    });
    return {
      success: true,
      data: data,
      message: "Success fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed fetched!",
    };
  }
};

export const getPurchaserNotInStockPurchaser = async () => {
  try {
    const data = await findUsersNotInStockPurchaser();
    return {
      success: true,
      data: data,
      message: "Success fetched!",
    };
  } catch (e) {
    return {
      success: false,
      error: e,
      message: "Failed fetched!",
    };
  }
};

export const StockRoomUserController = {
  create: async ({ data }: { data: CreateStockRoomUserDTO }) => {
    try {
      const res = await createStockRoomUser({ data });
      return {
        success: true,
        message: "New user added to stock room!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to add user in stock room!",
        error: e,
      };
    }
  },
  createBulk: async ({ data }: { data: CreateStockRoomUserDTO[] }) => {
    try {
      const res = await createStockRoomUserBulk({ data });
      return {
        success: true,
        message: "New users added to stock room!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to add user in stock room!",
        error: e,
      };
    }
  },

  get: async ({
    fields,
    arrayFields,
  }: {
    fields?: Partial<StockRoomUsers>;
    arrayFields?: Partial<Record<keyof StockRoomUsers, any[]>>;
  }) => {
    try {
      const data = await selecteStockRoomByFields({ fields, arrayFields });
      return {
        success: true,
        data: data,
      };
    } catch (e) {
      console.log(e);
      return {
        success: false,
        error: e,
      };
    }
  },
  getUserNotInStockRoom: async (stockRoomId: number) => {
    try {
      const data = await selectStockRoomUserNotInStockRomID(stockRoomId);
      return {
        success: true,
        data: data,
      };
    } catch (e) {
      return {
        success: false,
        error: e,
      };
    }
  },
  update: async ({
    data,
    keyFields = ["srUserId"],
  }: {
    data: Partial<StockRoomUsers>[];
    keyFields: (keyof StockRoomUsers)[];
  }) => {
    try {
      const res = await updateStockRoomUserByFields({ data, keyFields });
      return {
        success: true,
        message: "Stock room user updated successfully!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to update stock room user!",
        error: e,
      };
    }
  },
  delete: async ({
    data,
    keyFields = ["srUserId"],
  }: {
    data: Partial<StockRoomUsers>[];
    keyFields: (keyof StockRoomUsers)[];
  }) => {
    try {
      const res = await deleteStockRoomUserByFields({ data, keyFields });
      return {
        success: true,
        message: "Stock room user removed successfully!",
        data: res,
      };
    } catch (e) {
      return {
        success: false,
        message: "Failed to remove stock room user!",
        error: e,
      };
    }
  },
};
