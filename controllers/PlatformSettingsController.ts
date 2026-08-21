import { UpdatePlatformSettingsDto } from "@/dtos/platformSettings.dto";
import { AuthUser } from "@/lib/auth/getCurrentUser";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/models/platformSettingsModel";

// The flat per-store rate is a platform-wide pricing decision, not a
// tenant setting - only the platform-level superadmin may view/change it.
function assertIsSuperAdmin(actingUser: AuthUser) {
  if (actingUser.userRole !== "superadmin") {
    throw new Error("Only Super Admin can manage platform settings");
  }
}

export const getPlatformSettingsController = async (actingUser: AuthUser) => {
  try {
    assertIsSuperAdmin(actingUser);
    const data = await getPlatformSettings();
    return {
      data,
      message: "Platform settings fetched successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to fetch platform settings!",
      success: false,
    };
  }
};

export const updatePlatformSettingsController = async (
  data: UpdatePlatformSettingsDto,
  actingUser: AuthUser,
) => {
  try {
    assertIsSuperAdmin(actingUser);
    const result = await updatePlatformSettings({
      data,
      updatedBy: actingUser.userId,
    });
    return {
      data: result,
      message: "Platform settings updated successfully!",
      success: true,
    };
  } catch (e) {
    return {
      error: e,
      message: e instanceof Error ? e.message : "Failed to update platform settings!",
      success: false,
    };
  }
};
