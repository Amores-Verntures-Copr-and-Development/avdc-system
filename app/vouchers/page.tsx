import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import VoucherPage from "./VoucherPage";

const page = () => {
  return (
    <RequireRole>
      <VoucherPage />
    </RequireRole>
  );
};

export default page;
