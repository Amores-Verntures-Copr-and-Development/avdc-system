import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import DashboardPage from "./DashboardPage";

const page = () => {
  return (
    <RequireRole>
      <DashboardPage />
    </RequireRole>
  );
};

export default page;
