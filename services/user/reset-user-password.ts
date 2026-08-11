import { hashValue } from "@/utils/bcrypt";
import { updateUserPassword } from "@/models/userModels";

// Admin-initiated reset - unlike changeUserPassword (self-service, requires
// knowing the current password), this is for an Admin/Owner setting a new
// password on someone else's account, so there's no current-password check.
export async function resetUserPassword({
  userId,
  newPassword,
}: {
  userId: number;
  newPassword: string;
}) {
  const hashedPassword = await hashValue(newPassword);
  return updateUserPassword({ userId, hashedPassword });
}
