import { CreateStoreDto } from "@/dtos/store.dto";
import { insertStore, selectStores } from "../models/storeModels";

export const createStore = async (data: CreateStoreDto) => {
  try {
    await insertStore(data);
    return {
      success: true,
      message: "Store created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create store!",
      error: e,
    };
  }
};
export const getStore = async ({
  search,
  limit = 20,
  skip = 0,
}: {
  search?: string;
  limit?: number;
  skip?: number;
}) => {
  try {
    const data = await selectStores({ search, limit, skip });
    return {
      success: true,
      message: "Store created successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create store!",
      error: e,
    };
  }
};
