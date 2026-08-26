import { selectStoreCompanyId } from "@/models/storeModels";
import { AuthUser } from "./getCurrentUser";

export async function assertStoreAccess(actingUser: AuthUser, storeId: number) {
  if (actingUser.userRole === "superadmin") return;

  const storeCompanyId = await selectStoreCompanyId(storeId);
  if (storeCompanyId === null || storeCompanyId !== actingUser.companyId) {
    throw new Error("You do not have access to this store");
  }

  const isCompanyUnrestricted =
    actingUser.userRole === "owner" ||
    ["admin", "accounting"].includes(
      (actingUser as unknown as { empPosition?: string }).empPosition ?? "",
    );

  if (isCompanyUnrestricted) return;

  if (actingUser.storeId !== storeId) {
    throw new Error("You do not have access to this store");
  }
}
