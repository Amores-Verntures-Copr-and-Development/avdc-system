import React from "react";
import RequireRole from "@/components/shared/RequireRole";

import FinancialReportsPage from "./FinancialReportsPage";

const page = () => {
  return (
    <RequireRole>
      <FinancialReportsPage />
    </RequireRole>
  );
};

export default page;
