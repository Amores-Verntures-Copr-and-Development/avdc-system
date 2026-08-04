import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import PurchaseOrderPage from "./PurchaseOrderPage";

const page = () => {
  return (
    <RequireRole>
      <PurchaseOrderPage />
    </RequireRole>
  );
};

export default page;
