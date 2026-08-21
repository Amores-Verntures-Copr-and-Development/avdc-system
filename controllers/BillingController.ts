import { selectUserCompanyId } from "@/models/billingModel";
import { selectCompanies } from "@/models/companyModel";
import { getPlatformSettings } from "@/models/platformSettingsModel";
import { AuthUser } from "@/lib/auth/getCurrentUser";

// Billing is scoped to the acting Owner's own company - never trusts a
// client-supplied companyId, always resolves it server-side from the session.
function assertIsOwner(actingUser: AuthUser) {
  if (actingUser.userRole !== "owner") {
    throw new Error("Only the Company Owner can view billing");
  }
}

export const getMyCompanyBillingController = async (actingUser: AuthUser) => {
  try {
    assertIsOwner(actingUser);

    const companyId = await selectUserCompanyId({ userId: actingUser.userId });
    if (!companyId) {
      throw new Error("No company associated with this account");
    }

    const [company] = await selectCompanies({ keyFields: { companyId } });
    if (!company) {
      throw new Error("Company not found");
    }

    const settings = await getPlatformSettings();
    const pricePerStore = settings?.platformSettingPricePerStore ?? 0;
    const activeStoreCount = company.storeCount;

    return {
      data: {
        companyName: company.companyName,
        activeStoreCount,
        maxStores: company.companyMaxStores,
        pricePerStore,
        estimatedBill: activeStoreCount * pricePerStore,
      },
      message: "Billing fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch billing!",
      success: false,
    };
  }
};
