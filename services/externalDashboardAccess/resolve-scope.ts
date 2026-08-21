import { selectStoreIdsByCompanyId } from "@/models/storeModels";
import { selectUserCompanyId } from "@/models/billingModel";
import { getExternalDashboardAccessByUserId } from "./get-external-dashboard-access";

// A grant's `edaIsAllStores` flag and `storeIds` list are meant to mean "all
// (or some) of the granting company's stores" - but neither the flag nor
// the stored list actually carries a companyId, so read routes that only
// checked `edaIsAllStores || storeIds.includes(x)` would let a token grant
// data across every company, not just the grantee's own. This resolves the
// *real*, company-bounded set of storeIds every time, re-deriving "all
// stores" from the grantee's current companyId rather than trusting a
// stored boolean, and intersecting an explicit storeIds grant against that
// same company as defense-in-depth against a stale/bad grant.
export async function resolveExternalDashboardScope(userId: number) {
  const access = await getExternalDashboardAccessByUserId(userId);
  if (!access || access.edaStatus !== "active") {
    return {
      access: null,
      storeIds: [] as number[],
      isPermittedStore: () => false,
    };
  }

  const companyId = await selectUserCompanyId({ userId });
  const companyStoreIds = companyId
    ? await selectStoreIdsByCompanyId(companyId)
    : [];

  const storeIds = access.edaIsAllStores
    ? companyStoreIds
    : access.storeIds.filter((id) => companyStoreIds.includes(id));

  return {
    access,
    storeIds,
    isPermittedStore: (storeId: number) => storeIds.includes(storeId),
  };
}
