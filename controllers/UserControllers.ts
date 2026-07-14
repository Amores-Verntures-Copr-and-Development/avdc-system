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
import { InterStoreRequests } from "@/types/isr";

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
}: {
  userId: number;
  data: UpdateUserInfoDto;
}) => {
  try {
    const result = await updateUserInfo({ userId, data });
    return {
      success: true,
      message: "Profile updated successfully!",
      data: result,
    };
  } catch (e) {
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
