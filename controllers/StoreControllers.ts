import { CreateStoreDto } from "@/dtos/store.dto";
import { selectStores } from "../models/storeModels";
import { findStoreByPOID } from "@/services/store/get-store";
import { processCreateStore } from "@/services/store/process-create-store";

export const createStore = async (data: CreateStoreDto) => {
  try {
    await processCreateStore(data);
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

export const getStoreByPOId = async (poId: number) => {
  try {
    const data = await findStoreByPOID(poId);
    return {
      success: true,
      message: "Store fetch successfully!",
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
