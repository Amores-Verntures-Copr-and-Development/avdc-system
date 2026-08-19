import { AuthUser } from "./getCurrentUser";

// Owner/superadmin/admin manage every store; anyone else (staff, supervisor,
// purchaser, accounting, hr) may only act on the single store their session
// is currently scoped to - set via PUT /api/auth/store, which itself
// verifies real StoreEmployees membership before minting that claim. Route
// handlers that take a storeId from the URL must call this before touching
// that store's data, or any authenticated user can read/mutate another
// store's orders/sales/etc by editing the URL.
export function assertStoreAccess(actingUser: AuthUser, storeId: number) {
  const isUnrestricted =
    actingUser.userRole === "superadmin" ||
    actingUser.userRole === "owner" ||
    (actingUser as unknown as { empPosition?: string }).empPosition ===
      "admin";

  if (isUnrestricted) return;

  if (actingUser.storeId !== storeId) {
    throw new Error("You do not have access to this store");
  }
}
