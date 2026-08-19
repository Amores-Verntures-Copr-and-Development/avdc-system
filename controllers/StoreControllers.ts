import {
  CreateStoreDto,
  CreateStoreEmployeeDto,
  UpdateStoreFeaturesDto,
} from "@/dtos/store.dto";
import { selectStores, updateStoreFeatures } from "../models/storeModels";
import { AuthUser } from "@/lib/auth/getCurrentUser";
import {
  findStoreByEmpFields,
  findStoreByPOID,
} from "@/services/store/get-store";
import { processCreateStore } from "@/services/store/process-create-store";
import { EmployeeInterface } from "@/types/employees";
import {
  getStoreEmployee,
  getStoreEmployeeDetails,
} from "@/services/store/store-employee/get-store-employee";
import { createStoreEmployees } from "@/services/store/store-employee/create-store-employee";
import { StoreInterface } from "@/types/stores";

// Feature toggles (Kiosk/Order) gate what shows in the sidebar for a
// store's staff - only Owner/Admin/Super Admin should be able to flip
// them, checked server-side rather than trusting the client to only show
// the toggle to the right roles.
function assertIsAdminOrOwner(actingUser: AuthUser, action: string) {
  const canManage =
    actingUser.userRole === "superadmin" ||
    actingUser.userRole === "owner" ||
    (actingUser as unknown as { empPosition?: string }).empPosition ===
      "admin";

  if (!canManage) {
    throw new Error(`Only Owner or Admin can ${action}`);
  }
}

export const updateStoreFeaturesController = async ({
  storeId,
  data,
  actingUser,
}: {
  storeId: number;
  data: UpdateStoreFeaturesDto;
  actingUser: AuthUser;
}) => {
  try {
    assertIsAdminOrOwner(actingUser, "update store features");

    await updateStoreFeatures({ storeId, ...data });

    return {
      success: true,
      message: "Store features updated successfully!",
    };
  } catch (e: any) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update store features!",
      error: e,
    };
  }
};

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
  keyfields,
}: {
  search?: string;
  limit?: number;
  skip?: number;
  empKeyfields?: Partial<EmployeeInterface>;
  keyfields?: Partial<StoreInterface>;
}) => {
  try {
    let data;
    if (empKeyfields) {
      data = await findStoreByEmpFields({ keyFields: empKeyfields });
    } else {
      data = await selectStores({ search, limit, skip, keyfields });
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

export const getStoreEmployeeByFields = async ({
  keyFields,
}: {
  keyFields: Partial<EmployeeInterface>;
}) => {
  try {
    const data = await getStoreEmployee({ keyFields });
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

export const getStoreEmployeeDetailsByFields = async ({
  keyFields,
}: {
  keyFields: Partial<EmployeeInterface>;
}) => {
  try {
    const data = await getStoreEmployeeDetails({ keyFields });
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
