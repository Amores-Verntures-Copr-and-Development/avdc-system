import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import SupplierPage from "./SupplierPage";

const page = () => {
  return (
    <RequireRole>
      <SupplierPage />
    </RequireRole>
  );
};

export default page;
