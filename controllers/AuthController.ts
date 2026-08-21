import { UserAuthInterface } from "@/types/auth";
import { compareValue } from "@/utils/bcrypt";
import { findUserByUsername } from "../services/userServices";
import { generateTokens } from "@/utils/jwt";

export const logIn = async (data: UserAuthInterface) => {
  try {
    const users = await findUserByUsername(data.username);
    // Validate user existence
    if (!users?.length) return null;

    const user = users[0];
    // Validate password
    const isMatch = await compareValue(data.password, user.userPassword);
    if (!isMatch) return null;
    const hasOneStore = user?.storeEmployees?.length === 1;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(
      user.userId,
      user.userFname,
      user.userLname,
      user.userRole,
      user.empPosition,
      hasOneStore ? user?.storeEmployees[0].storeId : null,
      user.companyId ?? null,
    );
    // Return structured response
    return {
      user: {
        userId: user.userId,
        userFullName: `${user.userFname} ${user.userLname}`,
        userFname: user.userFname,
        userLname: user.userLname, // fixed typo
        userRole: user.userRole,
        empPosition: user.empPosition,
        storeId: hasOneStore ? user?.storeEmployees[0].storeId : null,
        companyId: user.companyId ?? null,
      },
      accessToken,
      refreshToken,
      store: hasOneStore ? user?.storeEmployees[0] : null,
    };
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
};
