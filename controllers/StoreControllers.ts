import { CreateStoreDto, CreateStoreEmployeeDto } from "@/dtos/store.dto";
import { selectStores } from "../models/storeModels";
import {
  findStoreByEmpFields,
  findStoreByPOID,
} from "@/services/store/get-store";
import { processCreateStore } from "@/services/store/process-create-store";
import { EmployeeInterface } from "@/types/employees";
import { getStoreEmployee } from "@/services/store/store-employee/get-store-employee";
import { createStoreEmployees } from "@/services/store/store-employee/create-store-employee";

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
  empKeyfields,
}: {
  search?: string;
  limit?: number;
  skip?: number;
  empKeyfields?: Partial<EmployeeInterface>;
}) => {
  try {
    let data;
    if (empKeyfields) {
      data = await findStoreByEmpFields({ keyFields: empKeyfields });
    } else {
      data = await selectStores({ search, limit, skip });
    }
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

export const getStoresByEmployeeByUserId = async (userId: number) => {
  try {
    const data = await getStoreEmployee({ keyFields: { userId: userId } });
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

export const addStoreEmployee = async (data: CreateStoreEmployeeDto[]) => {
  try {
    const result = await createStoreEmployees({ data });
    return {
      success: true,
      message: "Succesfully assigned store!",
      result: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to assigned store!",
      error: e,
    };
  }
};
