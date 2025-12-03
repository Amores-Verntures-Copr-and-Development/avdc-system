import { CreateUserDto } from "@/dtos/user.dto";
import { insertUser } from "@/models/userModels";
import { hashValue } from "@/utils/bcrypt";
import { PoolConnection } from "mysql2/promise";

export async function createUser(
  connection: PoolConnection,
  data: CreateUserDto
) {
  try {
    const hashedPassword = await hashValue(data.userPassword);
    const newData: CreateUserDto = {
      ...data,
      userPassword: hashedPassword,
    };
    const userId = await insertUser({ connection, data: newData });
    return userId;
  } catch (e) {
    throw e;
  }
}
