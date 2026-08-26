import {
  ChangeUserPasswordDto,
  CreateEmployeeDto,
  CreateUserDto,
  UpdateUserInfoDto,
} from "@/dtos/user.dto";
import { selectUsers, insertUser } from "../models/userModels";
import { handleCreateUser } from "@/services/user/handle-create-user";
import {
  getUserInfoByUserId,
  getUserNotInISRPurchser,
  getUserNotInISRRequestHandler,
} from "@/services/user/get-user";
import {
  changeUserPassword,
  updateUserInfo,
} from "@/services/user/update-user";
import { resetUserPassword } from "@/services/user/reset-user-password";
import { InterStoreRequests } from "@/types/isr";
import { AuthUser } from "@/lib/auth/getCurrentUser";

// Shared by any action where an admin needs to act on someone else's
// account (reset their password, edit their profile, etc.) - checked
// server-side rather than trusting the client to only show the button to
// the right roles.
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

export const createUser = async (
  data: CreateUserDto,
  actingUser: AuthUser,
) => {
  try {
    assertIsAdminOrOwner(actingUser, "create a user");

    // superadmin is the one platform-wide role - only an existing superadmin
    // may mint another one. Without this, an owner/admin (who otherwise
    // just needs to be allowed to create users at all) could self-escalate
    // by setting userRole: "superadmin" on the account they're creating.
    if (data.userRole === "superadmin" && actingUser.userRole !== "superadmin") {
      throw new Error("Only Super Admin can create a Super Admin account");
    }

    // companyId is always resolved server-side from the acting user, never
    // trusted from the request body - otherwise any caller could plant a
    // user (including an "owner") inside a company they don't belong to.
    const scopedData: CreateUserDto = {
      ...data,
      companyId:
        actingUser.userRole === "superadmin"
          ? data.companyId
          : actingUser.companyId ?? undefined,
    };

    const result = await handleCreateUser(scopedData);

    return {
      success: true,
      message: "User created succesfully!",
      result: result,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create user!",
      error: e,
    };
  }
};

export const getUsers = async ({
  search,
  actingUser,
}: {
  search?: string;
  actingUser: AuthUser;
}) => {
  try {
    const data = await selectUsers({
      search,
      companyId:
        actingUser.userRole === "superadmin"
          ? undefined
          : actingUser.companyId,
    });
    return {
      success: true,
      message: "Users fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
    };
  }
};

// Backs the Employees page - unlike getUsers (the Users admin page, which
// lists every account regardless of position), this always hides "staff"
// and, for a supervisor, scopes the list to their own store rather than
// the whole company.
export const getEmployees = async ({
  search,
  actingUser,
}: {
  search?: string;
  actingUser: AuthUser;
}) => {
  try {
    const empPosition = (actingUser as unknown as { empPosition?: string })
      .empPosition;
    const isSupervisor = empPosition === "supervisor";

    if (isSupervisor && !actingUser.storeId) {
      throw new Error("No store assigned to this account");
    }

    const data = await selectUsers({
      search,
      companyId:
        actingUser.userRole === "superadmin"
          ? undefined
          : actingUser.companyId,
      excludeEmpPositions: ["staff"],
      storeId: isSupervisor ? actingUser.storeId! : undefined,
    });
    return {
      success: true,
      message: "Employees fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to fetch employees!",
      error: e,
    };
  }
};

export const getUserInfo = async (userId: number) => {
  try {
    const data = await getUserInfoByUserId({ userId });
    return {
      success: true,
      message: "Users fetched successfully!",
      data: data ?? null,
    };
  } catch (e) {
    return {
      success: true,
      message: e,
    };
  }
};

export const updateUserInfoController = async ({
  userId,
  data,
  actingUser,
}: {
  userId: number;
  data: UpdateUserInfoDto;
  actingUser: AuthUser;
}) => {
  try {
    // Editing your own profile is always allowed; editing someone else's
    // requires Owner/Admin, same as resetting a password.
    if (actingUser.userId !== userId) {
      assertIsAdminOrOwner(actingUser, "edit another user's information");
    }

    const result = await updateUserInfo({ userId, data });
    return {
      success: true,
      message: "Profile updated successfully!",
      data: result,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to update profile!",
      error: e,
    };
  }
};

export const changeUserPasswordController = async ({
  userId,
  data,
}: {
  userId: number;
  data: ChangeUserPasswordDto;
}) => {
  try {
    const result = await changeUserPassword({
      userId,
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return {
      success: true,
      message: "Password changed successfully!",
      data: result,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to change password!",
      error: e,
    };
  }
};

export const getUserNotInISRPurchaserController = async ({
  keyFields,
  limit,
  search,
}: {
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
  limit: number;
  search?: string;
}) => {
  try {
    const res = await getUserNotInISRPurchser({ keyFields, limit, search });

    return res;
  } catch (e) {
    throw e;
  }
};

export const getUserNotInISRRequestHandlerController = async ({
  keyFields,
  limit,
  search,
}: {
  keyFields?: Partial<Record<keyof InterStoreRequests, any>>;
  limit: number;
  search?: string;
}) => {
  try {
    const res = await getUserNotInISRRequestHandler({
      keyFields,
      limit,
      search,
    });

    return res;
  } catch (e) {
    throw e;
  }
};

export const resetUserPasswordController = async ({
  userId,
  newPassword,
  actingUser,
}: {
  userId: number;
  newPassword: string;
  actingUser: AuthUser;
}) => {
  try {
    assertIsAdminOrOwner(actingUser, "reset a user's password");

    await resetUserPassword({ userId, newPassword });

    return {
      success: true,
      message: "Password reset successfully!",
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to reset password!",
      error: e,
    };
  }
};
