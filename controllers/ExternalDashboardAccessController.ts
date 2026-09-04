import { GrantExternalDashboardAccessDto } from "@/dtos/externalDashboardAccess.dto";
import { AuthUser } from "@/lib/auth/getCurrentUser";
import { selectUserCompanyId } from "@/models/billingModel";
import { selectStoreIdsByCompanyId } from "@/models/storeModels";
import { grantOrUpdateExternalDashboardAccess } from "@/services/externalDashboardAccess/grant-external-dashboard-access";
import { revokeExternalDashboardAccess } from "@/services/externalDashboardAccess/revoke-external-dashboard-access";
import { regenerateExternalDashboardAccessToken } from "@/services/externalDashboardAccess/regenerate-token";
import { getExternalDashboardAccessByUserId } from "@/services/externalDashboardAccess/get-external-dashboard-access";
import { verifyExternalDashboardToken } from "@/services/externalDashboardAccess/verify-token";
import { loginWithPassword } from "@/services/externalDashboardAccess/login-with-password";
import { signExternalDashboardSession } from "@/services/externalDashboardAccess/dashboard-session-jwt";

// Granting/revoking a dashboard API token is more sensitive than a typical
// UI action (it hands out standing external access to sales data), so this
// is checked server-side rather than trusting the client to only show the
// button to the right roles.
function assertCanManageExternalDashboardAccess(actingUser: AuthUser) {
  const canManage =
    actingUser.userRole === "superadmin" ||
    actingUser.userRole === "owner" ||
    (actingUser as unknown as { empPosition?: string }).empPosition ===
      "admin";

  if (!canManage) {
    throw new Error(
      "Only Owner or Admin can manage external dashboard access",
    );
  }
}

// Never trust that a target userId belongs to the acting owner/admin's own
// company - a grant/revoke/regenerate against another company's user would
// otherwise let one client company disrupt or hijack another's external
// dashboard access. superadmin is platform-wide and exempt.
async function assertTargetUserInSameCompany(
  actingUser: AuthUser,
  targetUserId: number,
) {
  if (actingUser.userRole === "superadmin") return;

  const targetCompanyId = await selectUserCompanyId({ userId: targetUserId });

  if (
    !targetCompanyId ||
    !actingUser.companyId ||
    targetCompanyId !== actingUser.companyId
  ) {
    throw new Error(
      "You can only manage external dashboard access for a user in your own company",
    );
  }
}

export const grantOrUpdateAccess = async (
  data: GrantExternalDashboardAccessDto,
  actingUser: AuthUser,
) => {
  try {
    assertCanManageExternalDashboardAccess(actingUser);
    await assertTargetUserInSameCompany(actingUser, data.userId);

    // A grant also hands out access to a specific store list - never trust
    // that those belong to the granting user's own company either.
    if (actingUser.userRole !== "superadmin" && actingUser.companyId) {
      if (
        !data.edaIsAllStores &&
        data.storeAccess &&
        data.storeAccess.length > 0
      ) {
        const companyStoreIds = await selectStoreIdsByCompanyId(
          actingUser.companyId,
        );
        const foreignStore = data.storeAccess.find(
          (s) => !companyStoreIds.includes(s.storeId),
        );
        if (foreignStore !== undefined) {
          throw new Error(
            "You can only grant access to stores in your own company",
          );
        }
      }
    }

    const { access, rawToken } =
      await grantOrUpdateExternalDashboardAccess(data);

    return {
      success: true,
      message: rawToken
        ? "External dashboard access granted!"
        : "External dashboard access updated!",
      data: { access, rawToken },
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to grant external dashboard access!",
      error: e,
    };
  }
};

export const revokeAccess = async (userId: number, actingUser: AuthUser) => {
  try {
    assertCanManageExternalDashboardAccess(actingUser);
    await assertTargetUserInSameCompany(actingUser, userId);

    const access = await revokeExternalDashboardAccess(userId);

    return {
      success: true,
      message: "External dashboard access revoked!",
      data: access,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to revoke external dashboard access!",
      error: e,
    };
  }
};

export const regenerateToken = async (
  userId: number,
  actingUser: AuthUser,
) => {
  try {
    assertCanManageExternalDashboardAccess(actingUser);
    await assertTargetUserInSameCompany(actingUser, userId);

    const { rawToken } =
      await regenerateExternalDashboardAccessToken(userId);

    return {
      success: true,
      message: "Token regenerated!",
      data: { rawToken },
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to regenerate token!",
      error: e,
    };
  }
};

// Single entry point for both credential types avdc-track's login page
// supports: a dashboard access token, or the user's own username/password.
// Either way the result is the same shape - identity/scope plus a signed
// session JWT - so avdc-track's session handling never needs to know or
// care which method was used to log in.
export const login = async (data: {
  token?: string;
  userName?: string;
  password?: string;
}) => {
  try {
    const identity = data.token
      ? await verifyExternalDashboardToken(data.token)
      : data.userName && data.password
        ? await loginWithPassword({
            userName: data.userName,
            password: data.password,
          })
        : null;

    if (!identity) {
      throw new Error("Provide either a token or a username and password");
    }

    const sessionToken = signExternalDashboardSession(identity.userId);

    return {
      success: true,
      message: "Login successful!",
      data: { ...identity, sessionToken },
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Invalid credentials",
      error: e,
    };
  }
};

export const getAccess = async (userId: number) => {
  try {
    const access = await getExternalDashboardAccessByUserId(userId);

    return {
      success: true,
      message: "Fetched external dashboard access!",
      data: access,
    };
  } catch (e: any) {
    return {
      success: false,
      message: e?.message || "Failed to fetch external dashboard access!",
      error: e,
    };
  }
};
