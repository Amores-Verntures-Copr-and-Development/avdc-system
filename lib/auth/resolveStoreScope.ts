import { selectStoreIdsByCompanyId } from "@/models/storeModels";
import { AuthUser } from "./getCurrentUser";
import { assertStoreAccess } from "./assertStoreAccess";

// Shared by the owner-dashboard endpoints: when a caller asks for one
// specific store, verify (via assertStoreAccess) that it's actually theirs;
// when they ask for the aggregate view (no storeId), resolve every store
// their own company owns instead of leaving the underlying query unscoped
// (which would otherwise blend every company's numbers together).
// superadmin gets neither restriction - both come back undefined, meaning
// "no filter, show everything" to the model layer.
export async function resolveStoreScope(
  actingUser: AuthUser,
  requestedStoreId?: number,
): Promise<{ storeId?: number; storeIds?: number[] }> {
  if (actingUser.userRole === "superadmin") {
    return { storeId: requestedStoreId };
  }

  if (requestedStoreId) {
    await assertStoreAccess(actingUser, requestedStoreId);
    return { storeId: requestedStoreId };
  }

  if (!actingUser.companyId) {
    return { storeIds: [] };
  }

  const storeIds = await selectStoreIdsByCompanyId(actingUser.companyId);
  return { storeIds };
}
