import React from "react";
import RequireRole from "@/components/shared/RequireRole";
import VoucherDetailPage from "./VoucherDetailPage";

const page = () => {
  return (
    <RequireRole>
      <VoucherDetailPage />
    </RequireRole>
  );
};

export default page;
