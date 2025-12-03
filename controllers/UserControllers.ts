import { CreateEmployeeDto, CreateUserDto } from "@/dtos/user.dto";
import { selectUsers, insertUser } from "../models/userModels";
import { handleCreateUser } from "@/services/user/handle-create-user";
import { getUserInfoByUserId } from "@/services/user/get-user";

export const createUser = async (data: CreateUserDto) => {
  try {
    const result = await handleCreateUser(data);
    console.log("result", { result });
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

export const getUsers = async () => {
  try {
    const data = await selectUsers({});
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
