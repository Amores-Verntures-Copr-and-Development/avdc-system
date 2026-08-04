import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import RequisitionPage from "./RequisitionPage";

const page = () => {
  return (
    <RequireRole>
      <RequisitionPage />
    </RequireRole>
  );
};

export default page;
