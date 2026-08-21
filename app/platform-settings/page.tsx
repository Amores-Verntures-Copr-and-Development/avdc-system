import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import PlatformSettingsPage from "./PlatformSettingsPage";

const page = () => {
  return (
    <RequireRole>
      <PlatformSettingsPage />
    </RequireRole>
  );
};

export default page;
