import { selectStoreCompanyId } from "@/models/storeModels";
import { AuthUser } from "./getCurrentUser";

// superadmin is the one legitimately platform-wide role (not scoped to any
// company). Owner/admin manage every store *within their own company*;
// anyone else (staff, supervisor, purchaser, accounting, hr) may only act
// on the single store their session is currently scoped to - set via
// PUT /api/auth/store, which itself verifies real StoreEmployees membership
// before minting that claim.
//
// Route handlers that take a storeId from the URL must call this before
// touching that store's data, or any authenticated user - including one
// from a different client company - can read/mutate another store's
// orders/sales/etc by editing the URL. The company check is the important
// half of this: it resolves the store's real owning company from the DB
// (never trusting a client-supplied companyId) rather than trusting the
// session's own storeId/role claims alone.
export async function assertStoreAccess(actingUser: AuthUser, storeId: number) {
  if (actingUser.userRole === "superadmin") return;

  const storeCompanyId = await selectStoreCompanyId(storeId);
  if (storeCompanyId === null || storeCompanyId !== actingUser.companyId) {
    throw new Error("You do not have access to this store");
  }

  const isCompanyUnrestricted =
    actingUser.userRole === "owner" ||
    (actingUser as unknown as { empPosition?: string }).empPosition ===
      "admin";

  if (isCompanyUnrestricted) return;

  if (actingUser.storeId !== storeId) {
    throw new Error("You do not have access to this store");
  }
}
