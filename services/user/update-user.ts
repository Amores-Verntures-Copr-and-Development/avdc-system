import { UpdateUserInfoDto } from "@/dtos/user.dto";
import { getDBConnection } from "@/lib/db";
import {
  selectUserWithUserId,
  updateUserInfo as updateUserInfoModel,
  updateUserPassword,
} from "@/models/userModels";
import { compareValue, hashValue } from "@/utils/bcrypt";

export async function updateUserInfo({
  userId,
  data,
}: {
  userId: number;
  data: UpdateUserInfoDto;
}) {
  try {
    const result = await updateUserInfoModel({ userId, data });
    return result;
  } catch (e) {
    throw e;
  }
}

export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword,
}: {
  userId: number;
  currentPassword: string;
  newPassword: string;
}) {
  try {
    const pool = await getDBConnection();
    const connection = await pool.getConnection();

    try {
      const users = await selectUserWithUserId({ userId, connection });
      const user = users[0];

      if (!user) {
        throw new Error("User not found.");
      }

      const isMatch = await compareValue(currentPassword, user.userPassword);

      if (!isMatch) {
        throw new Error("Current password is incorrect.");
      }

      const hashedPassword = await hashValue(newPassword);
      const result = await updateUserPassword({ userId, hashedPassword });
      return result;
    } finally {
      connection.release();
    }
  } catch (e) {
    throw e;
  }
}
