import { PlatformSettings } from "@/types/platformSettings";

export type UpdatePlatformSettingsDto = Pick<
  PlatformSettings,
  "platformSettingPricePerStore"
>;
