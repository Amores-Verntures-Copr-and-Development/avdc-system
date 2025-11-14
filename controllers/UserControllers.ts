import { CreateEmployeeDto, CreateUserDto } from "@/dtos/user.dto";
import { selectUsers, insertUser } from "../models/userModels";
import { hashValue } from "@/utils/bcrypt";
import { insertEmployee } from "../models/employeeModels";
import { getDBConnection } from "../lib/db";
import { PoolConnection } from "mysql2/promise";

async function handleCreateUser(
  connection: PoolConnection,
  data: CreateUserDto
) {
  const hashedPassword = await hashValue(data.userPassword);
  const newData: CreateUserDto = {
    ...data,
    userPassword: hashedPassword,
  };
  const userId = await insertUser({ connection, data: newData });
  return userId;
}
async function handleCreateEmployee(
  connection: PoolConnection,
  data: CreateEmployeeDto
) {
  const empId = await insertEmployee({ connection, data });
  return empId;
}

export const createUser = async (data: CreateUserDto) => {
  const pool = await getDBConnection();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const userId = await handleCreateUser(connection, data);
    if (data.userRole === "employee") {
      const newEmployeeData: CreateEmployeeDto = {
        userId: userId,
        empPosition: data.empPosition,
        storeId: data.storeId,
      };
      await handleCreateEmployee(connection, newEmployeeData);
    }
    await connection.commit();
    return {
      success: true,
      message: "User created succesfully!",
    };
  } catch (e) {
    await connection.rollback();
    return {
      success: false,
      message: "Failed to create user!",
      error: e,
    };
  } finally {
    connection.release();
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

