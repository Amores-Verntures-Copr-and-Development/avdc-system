import { CreateStockRoom, CreateStockStore } from "@/dtos/stockRoom.dto";
import { getStockRoom } from "@/services/stock-room/get-stock-room";
import { processCreateStockRoom } from "@/services/stock-room/process-create-stock-room";
import {
  findUsersNotInStockPurchaser,
  selectStockPurchaserBySPKeyFields,
} from "@/services/stock-room/stock-purchaser/get-stock-purchasers";
import { createStockStores } from "@/services/stock-room/stock-store/create-stock-store";
import {
  findStockStoresBySSKeyFields,
  findStockStoresByStockRoomKeyFields,
} from "@/services/stock-room/stock-store/get-stock-store";
import { StockPurchasers, StockRoom, StockStores } from "@/types/stockRoom";

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

export const getStockRooms = async () => {
  try {
    const data = await getStockRoom({});
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

