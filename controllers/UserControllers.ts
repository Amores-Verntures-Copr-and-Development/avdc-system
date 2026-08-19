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

export const createUser = async (data: CreateUserDto) => {
  try {
    const result = await handleCreateUser(data);

    return {
      success: true,
      message: "User created succesfully!",
      result: result,
    };
  } catch (e) {
    return {
      success: false,
      message: "Failed to create user!",
      error: e,
    };
  }
};

export const getUsers = async ({ search }: { search?: string }) => {
  try {
    const data = await selectUsers({ search });
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
