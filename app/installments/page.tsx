import RequireRole from "@/components/shared/RequireRole";
import React from "react";
import InstallmentsPage from "./InstallmentsPage";

const page = () => {
  return (
    <RequireRole>
      <InstallmentsPage />
    </RequireRole>
  );
};

export default page;
