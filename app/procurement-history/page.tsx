import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import ProcurementHistoryPage from "./ProcurementHistoryPage";

const page = () => {
  return (
    <RequireRole>
      <ProcurementHistoryPage />
    </RequireRole>
  );
};

export default page;
