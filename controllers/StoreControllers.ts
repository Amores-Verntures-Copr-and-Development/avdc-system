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
import { selectUserCompanyId } from "@/models/billingModel";
import { selectCompanies } from "@/models/companyModel";
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
    // The kiosk banner image is a low-stakes cosmetic setting any staff
    // member at the store can change - only the actual feature toggles
    // (Kiosk/Order enabled) are gated to Owner/Admin.
    if (
      data.storeKioskEnabled !== undefined ||
      data.storeOrderEnabled !== undefined
    ) {
      assertIsAdminOrOwner(actingUser, "update store features");
    }

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

export const createStore = async (
  data: CreateStoreDto,
  actingUser: AuthUser,
) => {
  try {
    assertIsAdminOrOwner(actingUser, "create a store");

    const companyId = await selectUserCompanyId({ userId: actingUser.userId });

    if (companyId) {
      const [company] = await selectCompanies({ keyFields: { companyId } });
      if (company && company.storeCount >= company.companyMaxStores) {
        throw new Error(
          "Store limit reached. Please ask your Super Admin to increase your maximum store limit.",
        );
      }
    }

    await processCreateStore({ ...data, companyId });
    return {
      success: true,
      message: "Store created successfully!",
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create store!",
      error: e,
    };
  }
};

// Lightweight companion to the Billing controller's numbers, but visible to
// Owner *and* Admin (not just Owner) since both can create stores - unlike
// billing, this never exposes pricing, just usage vs the cap.
export const getMyStoreLimitController = async (actingUser: AuthUser) => {
  try {
    assertIsAdminOrOwner(actingUser, "view the store limit");

    const companyId = await selectUserCompanyId({ userId: actingUser.userId });
    if (!companyId) {
      // Super Admin (or any user not tied to a company) has no cap.
      return {
        data: { activeStoreCount: 0, maxStores: null },
        message: "No store limit applies to this account.",
        success: true,
      };
    }

    const [company] = await selectCompanies({ keyFields: { companyId } });
    if (!company) {
      throw new Error("Company not found");
    }

    return {
      data: {
        activeStoreCount: company.storeCount,
        maxStores: company.companyMaxStores,
      },
      message: "Store limit fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch store limit!",
      success: false,
    };
  }
};
export const getStore = async ({
  search,
  limit = 20,
  skip = 0,
  empKeyfields,
  keyfields,
  actingUser,
}: {
  search?: string;
  limit?: number;
  skip?: number;
  empKeyfields?: Partial<EmployeeInterface>;
  keyfields?: Partial<StoreInterface>;
  // Optional only because a couple of internal/trusted callers (the
  // Loyverse OAuth callback, which validates a signed state token instead
  // of a session) don't have a request-scoped user. Any route handling a
  // client request must pass this so results get scoped to the caller's
  // own company - see the companyId merge below.
  actingUser?: AuthUser;
}) => {
  try {
    // superadmin is the one platform-wide role; everyone else only ever
    // sees their own company's stores, regardless of what keyfields the
    // caller asked for.
    const scopedKeyfields =
      actingUser && actingUser.userRole !== "superadmin"
        ? { ...keyfields, companyId: actingUser.companyId ?? undefined }
        : keyfields;

    let data;
    if (empKeyfields) {
      data = await findStoreByEmpFields({ keyFields: empKeyfields });
    } else {
      data = await selectStores({
        search,
        limit,
        skip,
        keyfields: scopedKeyfields,
      });
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
