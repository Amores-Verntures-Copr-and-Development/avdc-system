import { findUserByUsername } from "@/services/userServices";
import { compareValue } from "@/utils/bcrypt";
import {
  selectExternalDashboardAccessByUserId,
  touchExternalDashboardAccessLastAccessed,
} from "@/models/externalDashboardAccessModel";

// Same identity check as the main app's login (findUserByUsername +
// bcrypt compare), then gated on top by an active ExternalDashboardAccess
// grant - having a real avdc-system account is necessary but not
// sufficient, they still need to have been explicitly granted access.
export async function loginWithPassword({
  userName,
  password,
}: {
  userName: string;
  password: string;
}) {
  const users = await findUserByUsername(userName);
  const user = users?.[0];

  if (!user) {
    throw new Error("Invalid username or password");
  }

  const isMatch = await compareValue(password, user.userPassword);
  if (!isMatch) {
    throw new Error("Invalid username or password");
  }

  const access = await selectExternalDashboardAccessByUserId({
    userId: user.userId,
  });

  if (!access || access.edaStatus !== "active") {
    throw new Error("This account does not have external dashboard access");
  }

  await touchExternalDashboardAccessLastAccessed({ edaId: access.edaId });

  return {
    userId: user.userId,
    userFullName: `${user.userFname} ${user.userLname}`.trim(),
    isAllStores: Boolean(access.edaIsAllStores),
    storeIds: access.storeIds,
  };
}
